import type { HistoryLayer } from './HistoryLayer';
import type { NavigateOptions, NavigationCommitOptions } from './types';
import { devWarn } from './guards/devWarn';
import { hasWindow } from './guards/ssr';
import { shallowEqualArr, shallowEqualObj } from './diff';

// -----------------------------------------------------------------------------
// Op types
// -----------------------------------------------------------------------------

export type NavOp =
    | {
    kind: 'setRoute';
    layerId: string;
    segments: string[];
    opts: NavigateOptions;
}
    | {
    kind: 'setState';
    layerId: string;
    state: Record<string, unknown>;
    opts: NavigateOptions;
}
    | {
    kind: 'setParams';
    layerId: string;
    params: Record<string, string>;
    opts: NavigationCommitOptions;
}
    | {
    kind: 'setHash';
    layerId: string;
    hash: string;
    opts: NavigationCommitOptions;
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
    opts: NavigationCommitOptions;
}
    | {
    kind: 'popstate';
    rawState: unknown;
}
    | {
    kind: 'sentinelCorrection';
    direction: 'back' | 'forward';
};

export type NavResult =
    | { isOk: true }
    | { isOk: false; reason: 'blocked' | 'stale' | 'destroyed' | 'error'; error?: unknown };

interface QueuedEntry {
    op: NavOp;
    resolve: (r: NavResult) => void;
}

// -----------------------------------------------------------------------------
// Dependencies injected from the host (root layer + helpers)
// -----------------------------------------------------------------------------

export interface NavigationQueueDeps {
    /** Returns root layer (top window only). */
    getRoot: () => HistoryLayer;
    /** Find a layer by id starting at root. */
    findLayer: (id: string) => HistoryLayer | undefined;
    /** Run the block check pipeline for a target layer. Returns true if free to proceed. */
    checkBlocks: (target: HistoryLayer) => Promise<boolean>;
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
    /** Push a sentinel entry directly after a real push, given the projected state. */
    pushSentinel: (projectedState: Record<string, unknown>, entryId: string) => void;
    /** Move history without triggering our normal popstate handling (used for sentinel corrections). */
    silentGo: (delta: number) => Promise<void>;
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

    /** @internal Returns a snapshot of pending ops for debug tooling. */
    _debugQueueSnapshot(): NavOp[] {
        return this.queue.map((e) => e.op);
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
                    devWarn('QUEUE_OP_THREW', 'Navigation op threw', error);
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
            case 'sentinelCorrection':
                return this.processSentinelCorrection(op);
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
        if (op.childId && op.init) {
            const child = layer.getChildLayer(op.childId);
            if (child) {
                if (op.init.route) child._setOwnSegmentsSilent(op.init.route);
                if (op.init.state) child._setOwnStateSilent(op.init.state);
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
                }
            }
        }

        if (previousId !== op.childId) {
            this.commit(false);
            layer._emit('change'); // own-prop changed
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

        if (op.route) layer._setOwnSegmentsSilent(op.route);
        if (op.state) layer._setOwnStateSilent(op.state);
        if (op.params !== undefined) layer._setOwnParamsSilent(op.params);
        if (op.hash !== undefined) layer._setOwnHashSilent(op.hash);

        const segChanged = op.route ? !shallowEqualArr(prevSeg, op.route) : false;
        const stateChanged = op.state ? !shallowEqualObj(prevState, op.state) : false;
        const paramsChanged = op.params !== undefined ? !shallowEqualObj(prevParams, op.params) : false;
        const hashChanged = op.hash !== undefined ? prevHash !== op.hash : false;

        if (segChanged || stateChanged || paramsChanged || hashChanged) {
            this.commit(op.opts.isReplace === true);
            layer._emit('change');
        }
        return { isOk: true };
    }

    private async processPopstate(op: Extract<NavOp, { kind: 'popstate' }>): Promise<NavResult> {
        // 1. Dry-run diff to find which layers would change — without mutating tree.
        const { changedLayerIds } = this.deps.diffIncomingState(op.rawState);

        // 2. Block-check at the lowest common affected layer BEFORE applying.
        const target = this.resolveLowestCommonLayer(changedLayerIds);
        if (target) {
            const allowed = await this.deps.checkBlocks(target);
            if (!allowed) {
                // Blocked: revert browser position back one step to the sentinel.
                await this.deps.silentGo(+1);
                return { isOk: false, reason: 'blocked' };
            }
        }

        // 3. Apply the incoming state to the tree.
        const { changedLayerIds: applied } = this.deps.applyIncomingState(op.rawState);

        // 4. Fire popstate events on affected layers.
        for (const id of applied) {
            const layer = this.deps.findLayer(id);
            if (layer) layer._emit('popstate');
        }
        return { isOk: true };
    }

    private async processSentinelCorrection(
        op: Extract<NavOp, { kind: 'sentinelCorrection' }>,
    ): Promise<NavResult> {
        // Navigate past the sentinel onto the real entry.
        const delta = op.direction === 'back' ? -1 : +1;
        await this.deps.silentGo(delta);
        // After landing on the real entry, project a fresh sentinel ahead.
        const state = this.deps.projectState();
        const entryId = `real-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.deps.pushSentinel(state, entryId);
        return { isOk: true };
    }

// ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private resolveActiveLayer(id: string): HistoryLayer | undefined {
        const layer = this.deps.findLayer(id);
        if (!layer) {
            devWarn('LAYER_STALE', `Layer "${id}" not found at op time.`);
            return undefined;
        }
        if (layer._isDestroyed()) {
            devWarn('LAYER_DESTROYED', `Layer "${id}" was destroyed before op ran.`);
            return undefined;
        }
        if (!layer._isInActiveChain()) {
            devWarn('LAYER_INACTIVE', `Layer "${id}" is not in active chain — op skipped.`);
            return undefined;
        }
        return layer;
    }

    private resolveLowestCommonLayer(ids: Set<string>): HistoryLayer | undefined {
        if (ids.size === 0) return undefined;

        // Build ancestor lists for each changed layer, then find the lowest (deepest)
        // layer that is an ancestor of ALL changed layers.
        const ancestorLists: HistoryLayer[][] = [];
        for (const id of ids) {
            const layer = this.deps.findLayer(id);
            if (!layer) continue;
            const ancestors: HistoryLayer[] = [];
            let node: HistoryLayer | null = layer;
            while (node) {
                ancestors.unshift(node);
                node = node.parent ?? null;
            }
            ancestorLists.push(ancestors);
        }

        if (ancestorLists.length === 0) return undefined;
        if (ancestorLists.length === 1) return ancestorLists[0][ancestorLists[0].length - 1];

        // Walk the common prefix depth-by-depth.
        let lca: HistoryLayer | undefined;
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
        if (!hasWindow()) return;
        const url = this.deps.projectUrl();
        const state = this.deps.projectState();
        const entryId = `real-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Merge __idx and __entryId into the chayns state for direction tracking.
        const stateWithMeta = {
            ...state,
            __chaynsHistory: {
                ...(state.__chaynsHistory as object | undefined),
                __entryId: entryId,
            },
        };

        if (isReplace) {
            window.history.replaceState(stateWithMeta, '', url);
        } else {
            window.history.pushState(stateWithMeta, '', url);
        }
        this.deps.pushSentinel(stateWithMeta, entryId);
    }
}
