import type {
    HistoryLayer as IHistoryLayer,
    HistoryLayerEvent,
    NavigateOptions,
    NavigationCommitOptions,
    BlockOptions,
} from './types';
import { EventBus } from './EventBus';
import { devWarn } from './guards/devWarn';
import type { NavigationQueue } from './NavigationQueue';
import type { BlockRegistry } from './BlockRegistry';

/**
 * Reserved keys in a layer's state node. These are managed by the core
 * and MUST NOT be writable through `setState`.
 */
const RESERVED_STATE_KEYS = ['activeChild', 'childState', '__params', '__hash'] as const;

export interface HistoryLayerDeps {
    /** Reference to the root layer for queue + block registry access. */
    getRoot: () => HistoryLayer;
    /** Top-window navigation queue (singleton). */
    getQueue: () => NavigationQueue;
    /** Top-window block registry (singleton). */
    getBlockRegistry: () => BlockRegistry;
}

export interface HistoryLayerInit {
    id: string;
    parent: HistoryLayer | null;
    deps: HistoryLayerDeps;
    segmentCount?: number;
}

export class HistoryLayer implements IHistoryLayer {
    readonly id: string;
    readonly depth: number;

    readonly parent: HistoryLayer | null;

    /** Insertion-ordered map of children. */
    private readonly children = new Map<string, HistoryLayer>();

    /** Currently active child id (null = no child active). */
    private activeChildId: string | null = null;

    /** Number of URL segments this layer owns. */
    private segmentCount = 0;

    /** This layer's own URL segments (length must equal segmentCount when active). */
    private segments: string[] = [];

    /** This layer's own state slice (without reserved keys). */
    private ownState: Record<string, unknown> = {};

    /** This layer's own query params. Merged with other active-chain layers when projecting URL. */
    private _params: Record<string, string> = {};

    /**
     * This layer's own hash fragment (without `#`).
     * `undefined` = never explicitly set (unset/no opinion).
     * `''` = explicitly cleared.
     * `'foo'` = explicitly set to `'foo'`.
     */
    private _hash: string | undefined = undefined;

    /** Pub/sub for change + popstate events scoped to this layer. */
    private readonly bus = new EventBus<HistoryLayerEvent>();

    private readonly deps: HistoryLayerDeps;

    /** Lazily-resolved bootstrap URL segments. Null = not yet initialised. */
    private _bootstrapPool: string[] | null = null;
    /** Resolver called once on first consume to build the pool. */
    private _bootstrapUrlResolver: (() => string) | null = null;

    private isDestroyed = false;

    constructor(init: HistoryLayerInit) {
        this.id = init.id;
        this.parent = init.parent;
        this.depth = init.parent ? init.parent.depth + 1 : 0;
        this.deps = init.deps;
        this.segmentCount = init.segmentCount ?? 0;
    }

// ---------------------------------------------------------------------------
    // Segment count
    // ---------------------------------------------------------------------------

    getSegmentCount(): number {
        return this.segmentCount;
    }

    setSegmentCount(n: number): void {
        if (n < 0 || !Number.isInteger(n)) {
            devWarn('SEGMENT_COUNT_INVALID', `Invalid segmentCount ${n}`);
            return;
        }
        const prev = this.segmentCount;
        this.segmentCount = n;

        if (this._isInActiveChain()) {
            if (n < prev) {
                // Count decreased — cascade excess segments to the active child.
                const excess = this.segments.splice(n);
                if (excess.length > 0 && this.activeChildId) {
                    const child = this.children.get(this.activeChildId);
                    if (child) {
                        child._setOwnSegmentsSilent([...excess, ...child._getOwnSegments()]);
                    }
                }
            } else if (n > prev && this.segments.length === 0) {
                // Count increased from 0 and no segments assigned yet — try bootstrap pool.
                const root = this.deps.getRoot();
                const bootstrapSegs = root._consumeBootstrapSegments(n);
                if (bootstrapSegs) {
                    this.segments = bootstrapSegs;
                }
            }
            // Request a re-projection through the queue.
            void this.deps.getQueue().enqueue({
                kind: 'setRoute',
                layerId: this.id,
                segments: [...this.segments],
                opts: {},
            });
        }
    }

// ---------------------------------------------------------------------------
    // Children
    // ---------------------------------------------------------------------------

    createChildLayer(id: string): HistoryLayer {
        if (this.children.has(id)) {
            throw new Error(`[chaynsHistory] Child layer with id "${id}" already exists on layer "${this.id}".`);
        }
        const child = new HistoryLayer({
            id,
            parent: this,
            deps: this.deps,
        });
        this.children.set(id, child);
        return child;
    }

    destroyChildLayer(id: string): void {
        const child = this.children.get(id);
        if (!child) return;
        // Clean up blocks for all layers in the destroyed subtree.
        child.markDestroyed();
        this.children.delete(id);
        if (this.activeChildId === id) {
            this.activeChildId = null;
            // Enqueue a projection update so the URL/state reflects the loss.
            void this.deps.getQueue().enqueue({
                kind: 'setActiveChild',
                layerId: this.id,
                childId: null,
            });
        }
    }

    getChildLayer(id: string): HistoryLayer | undefined {
        return this.children.get(id);
    }

    getActiveChildId(): string | null {
        return this.activeChildId;
    }

    setActiveChild(
        id: string | null,
        init?: { route?: string[]; state?: Record<string, unknown> },
    ): void {
        if (this.isDestroyed) return;
        void this.deps.getQueue().enqueue({
            kind: 'setActiveChild',
            layerId: this.id,
            childId: id,
            init,
        });
    }

// ---------------------------------------------------------------------------
    // Routing
    // ---------------------------------------------------------------------------

    getRoute(): string[] {
        return [...this.segments];
    }

    setRoute(segments: string[], opts?: NavigateOptions): void {
        if (this.isDestroyed) return;
        void this.deps.getQueue().enqueue({
            kind: 'setRoute',
            layerId: this.id,
            segments: [...segments],
            opts: opts ?? {},
        });
    }

// ---------------------------------------------------------------------------
    // Params
    // ---------------------------------------------------------------------------

    getParams(): Record<string, string> {
        return { ...this._params };
    }

    setParams(params: Record<string, string>, opts?: NavigationCommitOptions): void {
        if (this.isDestroyed) return;
        void this.deps.getQueue().enqueue({
            kind: 'setParams',
            layerId: this.id,
            params: { ...params },
            opts: opts ?? {},
        });
    }

// ---------------------------------------------------------------------------
    // Hash
    // ---------------------------------------------------------------------------

    getHash(): string {
        return this._hash ?? '';
    }

    setHash(hash: string, opts?: NavigationCommitOptions): void {
        if (this.isDestroyed) return;
        // Normalize: strip leading '#'
        const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
        void this.deps.getQueue().enqueue({
            kind: 'setHash',
            layerId: this.id,
            hash: normalized,
            opts: opts ?? {},
        });
    }

// ---------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------

    getState<T = Record<string, unknown>>(): T | undefined {
        return { ...this.ownState } as unknown as T;
    }

    setState<T extends Record<string, unknown>>(state: T, opts?: NavigateOptions): void {
        if (this.isDestroyed) return;
        const filtered = HistoryLayer.filterReservedKeys(state);
        void this.deps.getQueue().enqueue({
            kind: 'setState',
            layerId: this.id,
            state: filtered,
            opts: opts ?? {},
        });
    }

    navigate(opts: { route?: string[]; state?: Record<string, unknown> } & NavigateOptions): void {
        if (this.isDestroyed) return;
        const { route, state, params, hash, ...rest } = opts;
        void this.deps.getQueue().enqueue({
            kind: 'navigate',
            layerId: this.id,
            route: route ? [...route] : undefined,
            state: state ? HistoryLayer.filterReservedKeys(state) : undefined,
            params,
            hash: hash !== undefined ? (hash.startsWith('#') ? hash.slice(1) : hash) : undefined,
            opts: rest,
        });
    }

// ---------------------------------------------------------------------------
    // Blocking
    // ---------------------------------------------------------------------------

    addBlock(callback: () => Promise<boolean>, opts: BlockOptions = {}): () => void {
        return this.deps.getBlockRegistry().add(this, callback, opts);
    }

// ---------------------------------------------------------------------------
    // Listeners
    // ---------------------------------------------------------------------------

    addEventListener(
        type: 'popstate' | 'change',
        handler: (e: HistoryLayerEvent) => void,
    ): () => void {
        return this.bus.on(type, handler);
    }

// ---------------------------------------------------------------------------
    // Internal API (used by NavigationQueue / projectors)
    // ---------------------------------------------------------------------------

    /** @internal */
    _getOwnState(): Record<string, unknown> {
        return this.ownState;
    }

    /** @internal */
    _getOwnSegments(): string[] {
        return this.segments;
    }

    /** @internal */
    _getChildren(): ReadonlyMap<string, HistoryLayer> {
        return this.children;
    }

    /** @internal Apply mutated own state without firing events (used by projectors). */
    _setOwnStateSilent(next: Record<string, unknown>): void {
        this.ownState = HistoryLayer.filterReservedKeys(next);
    }

    /** @internal Apply mutated segments without firing events. */
    _setOwnSegmentsSilent(next: string[]): void {
        this.segments = [...next];
    }

    /** @internal */
    _getOwnParams(): Record<string, string> { return this._params; }

    /** @internal */
    _setOwnParamsSilent(params: Record<string, string>): void { this._params = { ...params }; }

    /** @internal Returns the raw hash value (`undefined` = never set). */
    _getOwnHash(): string | undefined { return this._hash; }

    /** @internal */
    _setOwnHashSilent(hash: string | undefined): void { this._hash = hash; }

    /** @internal Set active child without enqueueing (used by projectors / queue processor). */
    _setActiveChildSilent(id: string | null): void {
        this.activeChildId = id;
    }

    /** @internal Emit a typed event. Called by queue after diff confirms relevance. */
    _emit(type: 'change' | 'popstate'): void {
        const event: HistoryLayerEvent = {
            type,
            layerId: this.id,
            segments: [...this.segments],
            state: { ...this.ownState },
            params: { ...this._params },
            hash: this._hash ?? '',
        };
        this.bus.emit(type, event);
    }

    /** @internal True if this layer is reachable via active chain from root. */
    _isInActiveChain(): boolean {
        let node: HistoryLayer | null = this;
        while (node && node.parent) {
            if (node.parent.activeChildId !== node.id) return false;
            node = node.parent;
        }
        return true;
    }

    /** @internal Register a lazy URL resolver (called once on first bootstrap consume). */
    _setBootstrapUrlResolver(resolver: () => string): void {
        this._bootstrapUrlResolver = resolver;
    }

    /** @internal Set the bootstrap pool directly (overrides the lazy resolver). */
    _setBootstrapPool(segs: string[]): void {
        this._bootstrapPool = [...segs];
    }

    /** @internal Consume the next `n` segments from the bootstrap pool. Returns null if pool is exhausted or unset. */
    _consumeBootstrapSegments(n: number): string[] | null {
        // Lazily resolve the pool on first use so that getSite() / window are available.
        if (this._bootstrapPool === null && this._bootstrapUrlResolver) {
            const pathname = this._bootstrapUrlResolver();
            this._bootstrapPool = pathname.replace(/^\//, '').split('/').filter(Boolean);
            this._bootstrapUrlResolver = null; // consume resolver
        }
        if (!this._bootstrapPool || this._bootstrapPool.length === 0 || n === 0) return null;
        const taken = this._bootstrapPool.splice(0, n);
        while (taken.length < n) taken.push('');
        return taken;
    }

    /** @internal */
    _isDestroyed(): boolean {
        return this.isDestroyed;
    }

    private markDestroyed(): void {
        this.isDestroyed = true;
        // Remove all blocks registered for this layer.
        try {
            this.deps.getBlockRegistry().removeAllForLayer(this.id);
        } catch {
            // BlockRegistry may not be available during teardown.
        }
        for (const child of this.children.values()) {
            child.markDestroyed();
        }
        this.children.clear();
        this.bus.clear();
    }

    private static filterReservedKeys<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
        const out: Record<string, unknown> = {};
        let hasReservedKeys = false;
        for (const key of Object.keys(input)) {
            if ((RESERVED_STATE_KEYS as readonly string[]).includes(key)) {
                hasReservedKeys = true;
                continue;
            }
            out[key] = input[key];
        }
        if (hasReservedKeys) {
            devWarn(
                'STATE_RESERVED_KEYS',
                `setState received reserved keys (${RESERVED_STATE_KEYS.join(', ')}) and stripped them.`,
            );
        }
        return out;
    }
}
