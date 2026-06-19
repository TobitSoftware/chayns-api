import type {
    ChaynsHistoryLayer,
    ChaynsHistoryNavigateOptions,
    ChaynsHistoryNavigationCommitOptions,
    ChaynsHistoryBlockOptions,
    ChaynsHistoryLayerEvent,
    ChaynsHistoryActionResult,
} from '../../types/history';
import { EventBus } from '../../utils/EventBus';
import { shallowEqualArr } from '../../utils/equality';
import { normalizeHistoryRouteInput, normalizeHistorySegments } from '../../utils/history/segments';

/**
 * Async bridge functions forwarded via comlink from the iframe (FrameWrapper) to
 * the parent window (HostIframe). All methods are async because they cross the
 * comlink boundary.
 *
 * Callbacks that cross the boundary (addBlock) must be wrapped with
 * `comlink.proxy()` by the caller (FrameWrapper.init) before being passed in.
 */
export interface HistoryBridgeFunctions {
    setRoute(route: string | string[], opts?: ChaynsHistoryNavigateOptions): Promise<void>;
    setParams(params: Record<string, string>, opts?: ChaynsHistoryNavigationCommitOptions): Promise<void>;
    setHash(hash: string, opts?: ChaynsHistoryNavigationCommitOptions): Promise<void>;
    setState(state: Record<string, unknown>, opts?: ChaynsHistoryNavigateOptions): Promise<void>;
    navigate(opts: { route?: string | string[]; state?: Record<string, unknown>; activeChild?: string | null; activeChildInit?: { route?: string | string[]; state?: Record<string, unknown> } } & ChaynsHistoryNavigateOptions): Promise<ChaynsHistoryActionResult>;
    setActiveChild(id: string | null, init?: { route?: string | string[]; state?: Record<string, unknown> }): Promise<ChaynsHistoryActionResult>;
    setSegmentCount(n: number): Promise<void>;
    /** Callback must be wrapped with comlink.proxy by FrameWrapper. Returns an async unsubscribe fn. */
    addBlock(callback: () => Promise<boolean>, opts?: ChaynsHistoryBlockOptions): Promise<() => void>;
}

/** Snapshot of the host layer's state transferred to the frame at init time. */
export interface HistoryInitialState {
    id: string;
    depth: number;
    segments: string[];
    params: Record<string, string>;
    hash: string;
    state: Record<string, unknown> | undefined;
    activeChildId: string | null;
    segmentCount: number;
}

/**
 * A `ChaynsHistoryLayer` proxy that runs inside an iframe (FrameWrapper).
 *
 * - **Reads** are served from a local cache for synchronous access.
 * - **Writes** are forwarded to the parent window via `bridge` functions.
 * - The cache is kept in sync by `FrameWrapper.init()`, which sets up a single
 *   comlink listener and calls `_applyAndEmit()` on every navigation event.
 * - **Child layers** are not supported in the frame context — manage sub-routing
 *   with a local `initRootChaynsHistoryLayer` inside the iframe instead.
 */
export class FrameHistoryLayer implements ChaynsHistoryLayer {
    readonly id: string;
    readonly depth: number;

    private _segments: string[];
    private _params: Record<string, string>;
    private _hash: string;
    private _state: Record<string, unknown> | undefined;
    private _activeChildId: string | null;
    private _segmentCount: number;

    private readonly bus = new EventBus<ChaynsHistoryLayerEvent>();
    private readonly bridge: HistoryBridgeFunctions;

    constructor(bridge: HistoryBridgeFunctions, initial: HistoryInitialState) {
        this.id = initial.id;
        this.depth = initial.depth;
        this._segments = normalizeHistorySegments(initial.segments);
        this._params = initial.params;
        this._hash = initial.hash;
        this._state = initial.state;
        this._activeChildId = initial.activeChildId;
        this._segmentCount = initial.segmentCount;
        this.bridge = bridge;
    }

    // region segment count

    getSegmentCount(): number {
        return this._segmentCount;
    }

    async setSegmentCount(n: number): Promise<void> {
        if (n === this._segmentCount) {
            return;
        }

        this._segmentCount = n;
        await this.bridge.setSegmentCount(n);
    }

    // endregion

    // region child layers (unsupported — manage child layers locally in the frame)

    createChildLayer(_id: string): ChaynsHistoryLayer {
        throw new Error(
            '[chaynsHistory] FrameHistoryLayer does not support createChildLayer. ' +
            'Manage sub-routing within the iframe with a local initRootChaynsHistoryLayer.',
        );
    }

    destroyChildLayer(_id: string): void { /* no-op */ }

    setActiveChild(id: string | null, init?: { route?: string | string[]; state?: Record<string, unknown> }): Promise<ChaynsHistoryActionResult> {
        return this.bridge.setActiveChild(id, init);
    }

    getActiveChildId(): string | null {
        return this._activeChildId;
    }

    getChildLayer(_id: string): ChaynsHistoryLayer | undefined {
        return undefined;
    }

    // endregion

    // region route

    getRoute(): string[] {
        return [...this._segments];
    }

    async setRoute(route: string | string[], opts?: ChaynsHistoryNavigateOptions): Promise<void> {
        const normalizedRoute = normalizeHistoryRouteInput(route);
        if (shallowEqualArr(this._segments, normalizedRoute)) {
            return;
        }
        await this.bridge.setRoute(normalizedRoute, opts);
    }

    // endregion

    // region params

    getParams(): Record<string, string> {
        return { ...this._params };
    }

    setParams(params: Record<string, string>, opts?: ChaynsHistoryNavigationCommitOptions): Promise<void> {
        return this.bridge.setParams(params, opts);
    }

    // endregion

    // region hash

    getHash(): string {
        return this._hash;
    }

    setHash(hash: string, opts?: ChaynsHistoryNavigationCommitOptions): Promise<void> {
        return this.bridge.setHash(hash, opts);
    }

    // endregion

    // region state

    getState<T extends object = Record<string, unknown>>(): T | undefined {
        return this._state as T | undefined;
    }

    setState<T extends object>(state: T, opts?: ChaynsHistoryNavigateOptions): Promise<void> {
        return this.bridge.setState(state as Record<string, unknown>, opts);
    }

    // endregion

    // region navigate

    navigate(opts: { route?: string | string[]; state?: Record<string, unknown>; activeChild?: string | null; activeChildInit?: { route?: string | string[]; state?: Record<string, unknown> } } & ChaynsHistoryNavigateOptions): Promise<ChaynsHistoryActionResult> {
        return this.bridge.navigate(opts);
    }

    // endregion

    // region block

    addBlock(callback: () => Promise<boolean>, opts?: ChaynsHistoryBlockOptions): () => void {
        let removeFn: (() => void) | null = null;
        void this.bridge.addBlock(callback, opts).then((fn) => { removeFn = fn; });
        return () => removeFn?.();
    }

    // endregion

    // region events

    addEventListener(type: 'popstate' | 'change', handler: (e: ChaynsHistoryLayerEvent) => void): () => void {
        return this.bus.on(type, handler);
    }

    // endregion

    /**
     * @internal Called by `FrameWrapper` when a navigation event arrives from the host.
     * Updates the local cache and re-emits the event to all registered listeners.
     */
    _applyAndEmit(e: ChaynsHistoryLayerEvent): void {
        this._segments = normalizeHistorySegments(e.segments);
        this._params = e.params;
        this._hash = e.hash;
        this._state = e.state;
        this.bus.emit(e.type, e);
    }
}
