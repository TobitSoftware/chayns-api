import type {
    ChaynsHistoryLayer as IChaynsHistoryLayer,
    ChaynsHistoryLayerEvent,
    ChaynsHistoryNavigateOptions,
    ChaynsHistoryNavigationCommitOptions,
    ChaynsHistoryBlockOptions,
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

export interface ChaynsHistoryLayerDeps {
    /** Reference to the root layer for queue + block registry access. */
    getRoot: () => ChaynsHistoryLayer;
    /** Top-window navigation queue (singleton). */
    getQueue: () => NavigationQueue;
    /** Top-window block registry (singleton). */
    getBlockRegistry: () => BlockRegistry;
}

export interface ChaynsHistoryLayerInit {
    id: string;
    parent: ChaynsHistoryLayer | null;
    deps: ChaynsHistoryLayerDeps;
    segmentCount?: number;
    /** Initial URL segments for this layer (length must equal segmentCount). */
    segments?: string[];
}

export class ChaynsHistoryLayer implements IChaynsHistoryLayer {
    readonly id: string;
    readonly depth: number;

    readonly parent: ChaynsHistoryLayer | null;

    /** Insertion-ordered map of children. */
    private readonly children = new Map<string, ChaynsHistoryLayer>();

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
    private readonly bus = new EventBus<ChaynsHistoryLayerEvent>();

    private readonly deps: ChaynsHistoryLayerDeps;

    /** Lazily-resolved bootstrap URL segments. Null = not yet initialised. */
    private _bootstrapPool: string[] | null = null;
    /** Resolver called once on first consume to build the pool. */
    private _bootstrapUrlResolver: (() => string) | null = null;

    private isDestroyed = false;

    constructor(init: ChaynsHistoryLayerInit) {
        this.id = init.id;
        this.parent = init.parent;
        this.depth = init.parent ? init.parent.depth + 1 : 0;
        this.deps = init.deps;
        this.segmentCount = init.segmentCount ?? 0;
        this.segments = init.segments ?? [];
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
                // The synchronous assignment above may have already updated this.segments,
                // so processSetRoute's diff would see no change. Force the notification so
                // subscribers (e.g. useRoute) always learn about the bootstrapped segments.
                _notifyEvenIfUnchanged: true,
            });
        }
    }

// ---------------------------------------------------------------------------
    // Children
    // ---------------------------------------------------------------------------

    createChildLayer(id: string): ChaynsHistoryLayer {
        if (this.children.has(id)) {
            throw new Error(`[chaynsHistory] Child layer with id "${id}" already exists on layer "${this.id}".`);
        }
        const child = new ChaynsHistoryLayer({
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
            // Do NOT set activeChildId to null here — let the queue op do it so that
            // processSetActiveChild sees a real diff (destroyedId → null) and calls
            // commit() + _emit('change') to update the URL and notify subscribers.
            void this.deps.getQueue().enqueue({
                kind: 'setActiveChild',
                layerId: this.id,
                childId: null,
            });
        }
    }

    getChildLayer(id: string): ChaynsHistoryLayer | undefined {
        return this.children.get(id);
    }

    getActiveChildId(): string | null {
        return this.activeChildId;
    }

    setActiveChild(
        id: string | null,
        init?: { route?: string | string[]; state?: Record<string, unknown> },
    ): void {
        if (this.isDestroyed) return;

        void this.deps.getQueue().enqueue({
            kind: 'setActiveChild',
            layerId: this.id,
            childId: id,
            init: init
                ? { ...init, route: init.route !== undefined ? ChaynsHistoryLayer.normalizeRoute(init.route) : undefined }
                : undefined,
        });
    }

// ---------------------------------------------------------------------------
    // Routing
    // ---------------------------------------------------------------------------

    getRoute(): string[] {
        return [...this.segments];
    }

    setRoute(route: string | string[], opts?: ChaynsHistoryNavigateOptions): void {
        if (this.isDestroyed) return;

        void this.deps.getQueue().enqueue({
            kind: 'setRoute',
            layerId: this.id,
            segments: ChaynsHistoryLayer.normalizeRoute(route),
            opts: opts ?? {},
        });
    }

// ---------------------------------------------------------------------------
    // Params
    // ---------------------------------------------------------------------------

    getParams(): Record<string, string> {
        return { ...this._params };
    }

    setParams(params: Record<string, string>, opts?: ChaynsHistoryNavigationCommitOptions): void {
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

    setHash(hash: string, opts?: ChaynsHistoryNavigationCommitOptions): void {
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

    getState<T extends object = Record<string, unknown>>(): T | undefined {
        return { ...this.ownState } as unknown as T;
    }

    setState<T extends object>(state: T, opts?: ChaynsHistoryNavigateOptions): void {
        if (this.isDestroyed) return;
        const filtered = ChaynsHistoryLayer.filterReservedKeys(state as Record<string, unknown>)

        void this.deps.getQueue().enqueue({
            kind: 'setState',
            layerId: this.id,
            state: filtered,
            opts: opts ?? {},
        });
    }

    navigate(opts: { route?: string | string[]; state?: Record<string, unknown>; activeChild?: string | null; activeChildInit?: { route?: string | string[]; state?: Record<string, unknown> } } & ChaynsHistoryNavigateOptions): void {
        if (this.isDestroyed) return;
        const { route, state, params, hash, activeChild, activeChildInit, ...rest } = opts;

        void this.deps.getQueue().enqueue({
            kind: 'navigate',
            layerId: this.id,
            route: route !== undefined ? ChaynsHistoryLayer.normalizeRoute(route) : undefined,
            state: state ? ChaynsHistoryLayer.filterReservedKeys(state) : undefined,
            params,
            hash: hash !== undefined ? (hash.startsWith('#') ? hash.slice(1) : hash) : undefined,
            activeChild,
            activeChildInit: activeChildInit
                ? { ...activeChildInit, route: activeChildInit.route !== undefined ? ChaynsHistoryLayer.normalizeRoute(activeChildInit.route) : undefined }
                : undefined,
            opts: rest,
        });
    }

// ---------------------------------------------------------------------------
    // Blocking
    // ---------------------------------------------------------------------------

    addBlock(callback: () => Promise<boolean>, opts: ChaynsHistoryBlockOptions = {}): () => void {
        return this.deps.getBlockRegistry().add(this, callback, opts);
    }

// ---------------------------------------------------------------------------
    // Listeners
    // ---------------------------------------------------------------------------

    addEventListener(
        type: 'popstate' | 'change',
        handler: (e: ChaynsHistoryLayerEvent) => void,
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
    _getChildren(): ReadonlyMap<string, ChaynsHistoryLayer> {
        return this.children;
    }

    /** @internal Apply mutated own state without firing events (used by projectors). */
    _setOwnStateSilent(next: Record<string, unknown>): void {
        this.ownState = ChaynsHistoryLayer.filterReservedKeys(next);
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
        const event: ChaynsHistoryLayerEvent = {
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
        let node: ChaynsHistoryLayer | null = this;
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

    private static normalizeRoute(route: string | string[]): string[] {
        if (Array.isArray(route)) return [...route];
        return route.split('/').filter(Boolean);
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
