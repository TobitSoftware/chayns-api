import type { ChaynsHistoryLayer } from '../../handler/history/HistoryLayer';
import type { ChaynsHistoryActionResult, ChaynsHistoryNavigateOptions, ChaynsHistoryNavigationCommitOptions } from '../../types/history';
import { hasWindowHistory } from './window';
import { shallowEqualArr, shallowEqualObj } from '../equality';

// -----------------------------------------------------------------------------
// Op types
// -----------------------------------------------------------------------------

export type NavOp =
    | {
    kind: 'setRoute';
    layerId: string;
    segments: string[];
    opts: ChaynsHistoryNavigateOptions;
    /** @internal Force a change notification even when segments appear unchanged (bootstrap via setSegmentCount). */
    _notifyEvenIfUnchanged?: true;
}
    | {
    kind: 'setState';
    layerId: string;
    state: Record<string, unknown>;
    opts: ChaynsHistoryNavigateOptions;
}
    | {
    kind: 'setParams';
    layerId: string;
    params: Record<string, string>;
    opts: ChaynsHistoryNavigationCommitOptions;
}
    | {
    kind: 'setHash';
    layerId: string;
    hash: string;
    opts: ChaynsHistoryNavigationCommitOptions;
}
    | {
    kind: 'setActiveChild';
    layerId: string;
    childId: string | null;
    init?: { route?: string[]; state?: Record<string, unknown> };
}
    | {
    kind: 'navigate';
    layerId: string;
    route?: string[];
    state?: Record<string, unknown>;
    params?: Record<string, string>;
    hash?: string;
    activeChild?: string | null;
    activeChildInit?: { route?: string[]; state?: Record<string, unknown> };
    opts: ChaynsHistoryNavigationCommitOptions;
}
    | {
    kind: 'popstate';
    rawState: unknown;
};

export type NavResult = ChaynsHistoryActionResult;

interface QueuedEntry {
    op: NavOp;
    resolve: (r: NavResult) => void;
}

// -----------------------------------------------------------------------------
// Dependencies injected from the host (root layer + helpers)
// -----------------------------------------------------------------------------

export interface NavigationQueueDeps {
    /** Returns root layer (top window only). */
    getRoot: () => ChaynsHistoryLayer;
    /** Find a layer by id starting at root. */
    findLayer: (id: string) => ChaynsHistoryLayer | undefined;
    /** Run the block check pipeline for a target layer. Returns true if free to proceed. */
    checkBlocks: (target: ChaynsHistoryLayer) => Promise<boolean>;
    /** Project the current memory tree into the URL string. */
    projectUrl: () => string;
    /** Project the current memory tree into the history state object (merged with existing foreign keys). */
    projectState: () => Record<string, unknown>;
    /**
     * Compute which layer ids WOULD change without mutating the tree.
     * Used to identify the block target before applying incoming state.
     */
    diffIncomingState: (raw: unknown) => { changedLayerIds: Set<string> };
    /** Apply an incoming raw `__chaynsHistory` state onto the memory tree. Returns affected layer ids. */
    applyIncomingState: (raw: unknown) => { changedLayerIds: Set<string> };
    /** Move history without triggering our normal popstate handling (used to undo blocked navigations). */
    silentGo: (delta: number) => Promise<void>;
    /** Returns the current navigation index (incremented on every push). */
    getCurrentIdx: () => number;
    /** Increments the navigation index and returns the new value. */
    incrementIdx: () => number;
    /**
     * Re-parse segments from `window.location.pathname` and apply them to each
     * layer in the active chain based on its `segmentCount`. Called after
     * `applyIncomingState` so the active chain reflects the new `activeChild`.
     * Returns the ids of layers whose segments actually changed.
     */
    applyUrlSegments: () => { changedLayerIds: Set<string> };
}

// -----------------------------------------------------------------------------
// Queue
// -----------------------------------------------------------------------------

export class NavigationQueue {
    private readonly queue: QueuedEntry[] = [];
    private isRunning = false;
    private readonly deps: NavigationQueueDeps;

    constructor(deps: NavigationQueueDeps) {
        this.deps = deps;
    }

    enqueue(op: NavOp): Promise<NavResult> {
        return new Promise<NavResult>((resolve) => {
            this.queue.push({ op, resolve });
            // Fire and forget; tick is async-safe.
            void this.tick();
        });
    }

    private async tick(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        try {
            while (this.queue.length > 0) {
                const entry = this.queue.shift()!;
                try {
                    const result = await this.process(entry.op);
                    entry.resolve(result);
                } catch (error) {
                    entry.resolve({ isOk: false, reason: 'error', error });
                }
            }
        } finally {
            this.isRunning = false;
        }
    }

// ---------------------------------------------------------------------------
    // Op dispatch
    // ---------------------------------------------------------------------------

    private async process(op: NavOp): Promise<NavResult> {
        switch (op.kind) {
            case 'setRoute':
                return this.processSetRoute(op);
            case 'setState':
                return this.processSetState(op);
            case 'setParams':
                return this.processSetParams(op);
            case 'setHash':
                return this.processSetHash(op);
            case 'setActiveChild':
                return this.processSetActiveChild(op);
            case 'navigate':
                return this.processNavigate(op);
            case 'popstate':
                return this.processPopstate(op);
            default: {
                const _exhaustive: never = op;
                return { isOk: false, reason: 'error', error: new Error('Unknown op') };
            }
        }
    }

// ---------------------------------------------------------------------------
    // Op handlers (skeletons — fill in alongside projectors / block registry)
    // ---------------------------------------------------------------------------

    private async processSetRoute(op: Extract<NavOp, { kind: 'setRoute' }>): Promise<NavResult> {
        const layer = this.resolveActiveLayer(op.layerId);
        if (!layer) return { isOk: false, reason: 'stale' };

        const allowed = await this.deps.checkBlocks(layer);
        if (!allowed) return { isOk: false, reason: 'blocked' };

        const prevSegments = layer._getOwnSegments();
        const prevParams = layer._getOwnParams();
        const prevHash = layer._getOwnHash();

        layer._setOwnSegmentsSilent(op.segments);
        if (op.opts.params !== undefined) layer._setOwnParamsSilent(op.opts.params);
        if (op.opts.hash !== undefined) layer._setOwnHashSilent(op.opts.hash);

        const changed =
            op._notifyEvenIfUnchanged === true ||
            !shallowEqualArr(prevSegments, op.segments) ||
            (op.opts.params !== undefined && !shallowEqualObj(prevParams, op.opts.params)) ||
            (op.opts.hash !== undefined && prevHash !== op.opts.hash);

        if (changed) {
            this.commit(op.opts.isReplace === true);
            layer._emit('change');
        }
        return { isOk: true };
    }

    private async processSetParams(op: Extract<NavOp, { kind: 'setParams' }>): Promise<NavResult> {
        const layer = this.resolveActiveLayer(op.layerId);
        if (!layer) return { isOk: false, reason: 'stale' };

        const allowed = await this.deps.checkBlocks(layer);
        if (!allowed) return { isOk: false, reason: 'blocked' };

        const prev = layer._getOwnParams();
        layer._setOwnParamsSilent(op.params);

        if (!shallowEqualObj(prev, op.params)) {
            this.commit(op.opts.isReplace === true);
            layer._emit('change');
        }
        return { isOk: true };
    }

    private async processSetHash(op: Extract<NavOp, { kind: 'setHash' }>): Promise<NavResult> {
        const layer = this.resolveActiveLayer(op.layerId);
        if (!layer) return { isOk: false, reason: 'stale' };

        const allowed = await this.deps.checkBlocks(layer);
        if (!allowed) return { isOk: false, reason: 'blocked' };

        const prev = layer._getOwnHash();
        layer._setOwnHashSilent(op.hash);

        if (prev !== op.hash) {
            this.commit(op.opts.isReplace === true);
            layer._emit('change');
        }
        return { isOk: true };
    }

    private async processSetState(op: Extract<NavOp, { kind: 'setState' }>): Promise<NavResult> {
        const layer = this.resolveActiveLayer(op.layerId);
        if (!layer) return { isOk: false, reason: 'stale' };

        const allowed = await this.deps.checkBlocks(layer);
        if (!allowed) return { isOk: false, reason: 'blocked' };

        const previous = layer._getOwnState();
        layer._setOwnStateSilent(op.state);

        const changed = !shallowEqualObj(previous, op.state);
        if (changed) {
            this.commit(op.opts.isReplace === true);
            layer._emit('change');
        }
        return { isOk: true };
    }

    private async processSetActiveChild(op: Extract<NavOp, { kind: 'setActiveChild' }>): Promise<NavResult> {
        const layer = this.resolveActiveLayer(op.layerId);
        if (!layer) return { isOk: false, reason: 'stale' };

        const allowed = await this.deps.checkBlocks(layer);
        if (!allowed) return { isOk: false, reason: 'blocked' };

        const previousId = layer.getActiveChildId();
        if (op.childId !== null && !layer.getChildLayer(op.childId)) {
            // Auto-create on demand. Documented behavior.
            layer.createChildLayer(op.childId);
        }
        layer._setActiveChildSilent(op.childId);

        // Apply optional initial route/state to the (now active) child.
        let childDataChanged = false;
        if (op.childId && op.init) {
            const child = layer.getChildLayer(op.childId);
            if (child) {
                if (op.init.route) { child._setOwnSegmentsSilent(op.init.route); childDataChanged = true; }
                if (op.init.state) { child._setOwnStateSilent(op.init.state); childDataChanged = true; }
            }
        }

        // If the child has no segments yet, try to seed from the bootstrap URL pool.
        if (op.childId) {
            const child = layer.getChildLayer(op.childId);
            if (child && child._getOwnSegments().length === 0 && child.getSegmentCount() > 0) {
                const root = this.deps.getRoot();
                const bootstrapSegs = root._consumeBootstrapSegments(child.getSegmentCount());
                if (bootstrapSegs) {
                    child._setOwnSegmentsSilent(bootstrapSegs);
                    childDataChanged = true;
                }
            }
        }

        if (previousId !== op.childId) {
            this.commit(false);
            layer._emit('change'); // own-prop changed
        }

        // Notify the child's own subscribers when its data was seeded here so that
        // hooks like useRoute() on the child layer re-render with the correct values.
        if (childDataChanged && op.childId) {
            const child = layer.getChildLayer(op.childId);
            if (child) child._emit('change');
        }
        return { isOk: true };
    }

    private async processNavigate(op: Extract<NavOp, { kind: 'navigate' }>): Promise<NavResult> {
        const layer = this.resolveActiveLayer(op.layerId);
        if (!layer) return { isOk: false, reason: 'stale' };

        const allowed = await this.deps.checkBlocks(layer);
        if (!allowed) return { isOk: false, reason: 'blocked' };

        const prevSeg = layer._getOwnSegments();
        const prevState = layer._getOwnState();
        const prevParams = layer._getOwnParams();
        const prevHash = layer._getOwnHash();
        const prevActiveChild = layer.getActiveChildId();

        if (op.route) layer._setOwnSegmentsSilent(op.route);
        if (op.state) layer._setOwnStateSilent(op.state);
        if (op.params !== undefined) layer._setOwnParamsSilent(op.params);
        if (op.hash !== undefined) layer._setOwnHashSilent(op.hash);

        const segChanged = op.route ? !shallowEqualArr(prevSeg, op.route) : false;
        const stateChanged = op.state ? !shallowEqualObj(prevState, op.state) : false;
        const paramsChanged = op.params !== undefined ? !shallowEqualObj(prevParams, op.params) : false;
        const hashChanged = op.hash !== undefined ? prevHash !== op.hash : false;

        // Handle activeChild switching inline — same logic as processSetActiveChild.
        let activeChildChanged = false;
        let childDataChanged = false;
        if (op.activeChild !== undefined) {
            if (op.activeChild !== null && !layer.getChildLayer(op.activeChild)) {
                layer.createChildLayer(op.activeChild);
            }
            layer._setActiveChildSilent(op.activeChild);
            activeChildChanged = prevActiveChild !== op.activeChild;

            if (op.activeChild && op.activeChildInit) {
                const child = layer.getChildLayer(op.activeChild);
                if (child) {
                    if (op.activeChildInit.route) { child._setOwnSegmentsSilent(op.activeChildInit.route); childDataChanged = true; }
                    if (op.activeChildInit.state) { child._setOwnStateSilent(op.activeChildInit.state); childDataChanged = true; }
                }
            }

            if (op.activeChild) {
                const child = layer.getChildLayer(op.activeChild);
                if (child && child._getOwnSegments().length === 0 && child.getSegmentCount() > 0) {
                    const root = this.deps.getRoot();
                    const bootstrapSegs = root._consumeBootstrapSegments(child.getSegmentCount());
                    if (bootstrapSegs) {
                        child._setOwnSegmentsSilent(bootstrapSegs);
                        childDataChanged = true;
                    }
                }
            }
        }

        if (segChanged || stateChanged || paramsChanged || hashChanged || activeChildChanged) {
            this.commit(op.opts.isReplace === true);
            layer._emit('change');
        }

        if (childDataChanged && op.activeChild) {
            const child = layer.getChildLayer(op.activeChild);
            if (child) child._emit('change');
        }

        return { isOk: true };
    }

    private async processPopstate(op: Extract<NavOp, { kind: 'popstate' }>): Promise<NavResult> {
        // 1. Dry-run diff to find which layers would change — without mutating tree.
        //    a) State blob diff (ownState / params / hash / activeChild).
        const { changedLayerIds } = this.deps.diffIncomingState(op.rawState);

        //    b) URL segment diff: segments live in the URL, not the state blob.
        //       window.location already reflects the new URL at popstate time.
        //       We compare the current in-memory projected URL vs the browser URL
        //       to find layers whose segments would change.
        //       Note: applyUrlSegments mutates the tree, so we run it after the block check.
        //       Instead, we detect whether ANY segment change is pending by comparing URLs.
        const currentProjectedUrl = this.deps.projectUrl();
        const browserPathname = hasWindowHistory() ? window.location.pathname : '';
        if (browserPathname && browserPathname !== new URL(currentProjectedUrl, 'http://x').pathname) {
            // At least one layer's segments differ. Since we can't know WHICH layer without
            // running parseFromUrl (which needs the post-apply active chain), we conservatively
            // target the root layer so blocks registered anywhere in the tree are checked.
            changedLayerIds.add(this.deps.getRoot().id);
        }

        // 2. Block-check at the lowest common affected layer BEFORE applying.
        const target = this.resolveLowestCommonLayer(changedLayerIds);
        if (target) {
            const allowed = await this.deps.checkBlocks(target);
            if (!allowed) {
                // Blocked: revert browser position back one step.
                await this.deps.silentGo(+1);
                return { isOk: false, reason: 'blocked' };
            }
        }

        // 3. Apply the incoming state to the tree.
        const { changedLayerIds: applied } = this.deps.applyIncomingState(op.rawState);

        // 4. Re-parse segments from the new URL — segments live in the URL, not in the
        //    history state blob. Must run after applyIncomingState so that activeChild
        //    is up to date and getActiveChain() returns the correct layers.
        const { changedLayerIds: urlChanged } = this.deps.applyUrlSegments();
        const allChanged = new Set([...applied, ...urlChanged]);

        // 5. Fire popstate events on affected layers.
        for (const id of allChanged) {
            const layer = this.deps.findLayer(id);
            if (layer) layer._emit('popstate');
        }
        return { isOk: true };
    }

// ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private resolveActiveLayer(id: string): ChaynsHistoryLayer | undefined {
        const layer = this.deps.findLayer(id);
        if (!layer) {
            return undefined;
        }
        if (layer._isDestroyed()) {
            return undefined;
        }
        if (!layer._isInActiveChain()) {
            return undefined;
        }
        return layer;
    }

    private resolveLowestCommonLayer(ids: Set<string>): ChaynsHistoryLayer | undefined {
        if (ids.size === 0) return undefined;

        // Build ancestor lists for each changed layer, then find the lowest (deepest)
        // layer that is an ancestor of ALL changed layers.
        const ancestorLists: ChaynsHistoryLayer[][] = [];
        for (const id of ids) {
            const layer = this.deps.findLayer(id);
            if (!layer) continue;
            const ancestors: ChaynsHistoryLayer[] = [];
            let node: ChaynsHistoryLayer | null = layer;
            while (node) {
                ancestors.unshift(node);
                node = node.parent ?? null;
            }
            ancestorLists.push(ancestors);
        }

        if (ancestorLists.length === 0) return undefined;
        if (ancestorLists.length === 1) return ancestorLists[0][ancestorLists[0].length - 1];

        // Walk the common prefix depth-by-depth.
        let lca: ChaynsHistoryLayer | undefined;
        const minLen = Math.min(...ancestorLists.map((a) => a.length));
        for (let d = 0; d < minLen; d++) {
            const candidate = ancestorLists[0][d];
            if (ancestorLists.every((a) => a[d]?.id === candidate.id)) {
                lca = candidate;
            } else {
                break;
            }
        }
        return lca;
    }

    private commit(isReplace: boolean): void {
        if (!hasWindowHistory()) return;
        const url = this.deps.projectUrl();
        const state = this.deps.projectState();

        const idx = isReplace ? this.deps.getCurrentIdx() : this.deps.incrementIdx();
        const stateWithMeta = {
            ...state,
            __chaynsHistory: {
                ...(state.__chaynsHistory as object | undefined),
                __idx: idx,
            },
        };

        if (isReplace) {
            window.history.replaceState(stateWithMeta, '', url);
        } else {
            window.history.pushState(stateWithMeta, '', url);
        }
    }
}
