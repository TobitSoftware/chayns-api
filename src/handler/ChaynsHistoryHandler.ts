import {
    BaseHistoryState,
    BlockCallback,
    HistoryFunctions,
    IChaynsHistoryHandler,
    PopStateCallback
} from "../types/history";
import {beforeUnloadCallback} from "../util/history/history";
import {firstMatchingPromise} from "../util/firstMatchingPromise";

/**
 * Wraps a set of `HistoryFunctions` with block-checking, child-handler
 * delegation, and active-id tracking.
 *
 * ## Architecture
 *
 * History is managed as a tree:
 * - The root `ChaynsHistoryHandler` (exported as `rootHistory`) owns
 *   `window.history` directly.
 * - Each feature or page level calls `createChild(id, initialState)` to get a
 *   child handler.  Only the child whose `id` matches the parent's `_activeId`
 *   may push or replace state; all others return `false`.
 * - Children can be nested arbitrarily deep.  State is stored as a recursive
 *   `childState` field inside the root `window.history.state`.
 *
 * ## State flow
 *
 * `child.pushState(location, childState)` →
 *   parent._getNewState(childState)        // wraps childState inside parent state
 *   parent.pushState(location, merged)     // delegates upward
 *   …(repeats until root)…
 *   window.history.pushState(finalState)   // single write at the root
 */
export class ChaynsHistoryHandler<State extends BaseHistoryState = BaseHistoryState> implements IChaynsHistoryHandler<State> {
    private readonly _historyFunctions: HistoryFunctions<State>;
    /** The id of the child handler that is currently allowed to navigate. */
    private _activeId: string | number | null = null;
    /** Per-child arrays of registered block callbacks, keyed by child id. */
    private _blocks: Record<string | number, BlockCallback[]> = {};
    /**
     * The path-segment index where this handler's own route begins.
     * `-1` means the handler owns the entire path.
     */
    private _safeRouteIndex: number = -1;
    /** Callbacks registered by child handlers to receive popstate notifications. */
    private _popStateCallbacks: Set<PopStateCallback<BaseHistoryState>> = new Set();
    /** Cleanup function that removes the popstate subscription from the parent. */
    private _removePopStateListener: (() => void) | undefined;

    constructor(initialState: State, historyFunctions: HistoryFunctions<State>) {
        this._historyFunctions = historyFunctions;
        void this.replaceState(window.location.href, initialState);
    }

    /**
     * Create a child handler that gates all navigation through this handler.
     *
     * The child will only perform navigation when:
     * 1. Its `id` matches `this._activeId` (i.e. it is the currently active child).
     * 2. No registered block callback vetoes the navigation.
     *
     * State written by the child is embedded as `childState` inside this
     * handler's own state, so the full history tree is serialised into a single
     * `window.history.state` entry.
     */
    createChild<ChildState extends BaseHistoryState = BaseHistoryState>(id: string | number, initialState: ChildState = {} as ChildState): IChaynsHistoryHandler<ChildState> {
        return new ChaynsHistoryHandler(initialState, {
            pushState: async (location, state) => {
                if (this._activeId !== id || await this._checkBlock())
                    return false;
                return await this.pushState(this._getNewLocation(location), this._getNewState(state));
            },
            replaceState: async (location, state) => {
                if (this._activeId !== id || await this._checkBlock())
                    return false;
                return await this.replaceState(this._getNewLocation(location), this._getNewState(state));
            },
            getLocation: () => {
                if (this._activeId !== id)
                    throw new Error("History is not active")
                const currentLocation = this.getLocation();
                if (this._safeRouteIndex === -1)
                    return currentLocation;
                // Return only the path segment(s) that belong to this child.
                return currentLocation.split('/').slice(this._safeRouteIndex).join('/');
            },
            getState: () => {
                if (this._activeId !== id)
                    throw new Error("History is not active")
                return this.getState().childState as ChildState;
            },
            forward: async () => {
                if (this._activeId !== id || await this._checkBlock())
                    return false;
                return await this.forward();
            },
            back: async () => {
                if (this._activeId !== id || await this._checkBlock())
                    return false;
                return await this.back();
            },
            go: async (delta) => {
                if (this._activeId !== id || await this._checkBlock())
                    return false;
                return await this.go(delta);
            },
            block: (callback) => {
                this._blocks[id] ??= [];
                if (this._activeId === id && this._blocks[id].length === 0) {
                    window.addEventListener('beforeunload', beforeUnloadCallback);
                }
                this._blocks[id].push(callback);
                const removeBlock = this.block(callback);
                return () => {
                    this._blocks[id] = this._blocks[id].filter(cb => cb !== callback);
                    if (this._blocks[id].length === 0) {
                        delete this._blocks[id];
                    }
                    if (this._activeId === id && !this._blocks[id]) {
                        window.removeEventListener('beforeunload', beforeUnloadCallback);
                    }
                    removeBlock();
                };
            },
            addPopStateListener: (callback) => {
                this._popStateCallbacks.add(callback);
                // Subscribe to the parent only once for all child listeners.
                if (this._popStateCallbacks.size === 1 && !this._removePopStateListener)
                    this._removePopStateListener = this._historyFunctions.addPopStateListener((state, previousState) => this._popStateCallback(state, previousState));
                return () => {
                    this._popStateCallbacks.delete(callback);
                    if (this._popStateCallbacks.size === 0 && this._removePopStateListener) {
                        this._removePopStateListener();
                        this._removePopStateListener = undefined;
                    }
                }
            }
        } as ChaynsHistoryHandler<ChildState>);
    }

    /**
     * Forwards a popstate event received from the parent down to all child
     * listeners, but only when the child state has actually changed.
     */
    private _popStateCallback(state?: State, previousState?: State): Promise<boolean> {
        const hasChanged = (state !== previousState || !state || !previousState) || JSON.stringify(state.childState) === JSON.stringify(previousState.childState);

        if (hasChanged) {
            [...this._popStateCallbacks].forEach(cb => cb(state?.childState, previousState?.childState));
        }

        return Promise.resolve(true);
    }

    /** Wrap `childState` inside the current parent state. */
    private _getNewState(childState: State['childState']): State {
        return {
            ...this.getState(),
            childState
        };
    }

    /**
     * Translate a child-relative `location` into a parent-relative location.
     *
     * When `_safeRouteIndex === -1` the child owns the full path, so the
     * location is returned unchanged.  Otherwise the path segments that belong
     * to the parent are preserved and only the child's own segments are
     * replaced.
     */
    private _getNewLocation(location: string) {
        if (this._safeRouteIndex === -1)
            return location;
        const currentLocation = this.getLocation();
        return [...currentLocation.split('/').slice(0, this._safeRouteIndex).filter(Boolean), ...location.split('/').filter(Boolean)].join('/');
    }

    /**
     * Synchronises instance fields with the state object before writing it to
     * `window.history`.
     *
     * - If `state.activeId` is provided, updates `_activeId` and toggles the
     *   `beforeunload` listener accordingly.
     * - If `state.safeRouteIndex` is provided, updates `_safeRouteIndex`.
     * - Missing fields are back-filled from the current instance values so
     *   that round-tripping state through `window.history` is lossless.
     */
    private _syncState(state: State) {
        if (state.activeId !== undefined) {
            this._activeId = state.activeId;
            if (state.activeId !== null && this._blocks[state.activeId]) {
                window.addEventListener('beforeunload', beforeUnloadCallback);
            } else {
                window.removeEventListener('beforeunload', beforeUnloadCallback);
            }
        } else {
            state.activeId = this._activeId;
        }
        if (state.safeRouteIndex !== undefined) {
            this._safeRouteIndex = state.safeRouteIndex;
        } else {
            state.safeRouteIndex = this._safeRouteIndex;
        }
    }

    /**
     * Run all block callbacks for the currently active child.
     *
     * Returns `true` if any callback vetoes the navigation (i.e. a block is
     * active), `false` if navigation should proceed.  Uses
     * `firstMatchingPromise` to short-circuit as soon as a `false` (allow) is
     * returned by any callback.
     */
    private async _checkBlock() {
        if (this._activeId == null) {
            return false;
        }
        const currentBlocks = this._blocks[this._activeId];

        if (!currentBlocks?.length) {
            return false;
        }

        const wrappedPromises = Object.values(currentBlocks).map(async (callback) => {
            try {
                return await callback();
            } catch {
                return false;
            }
        });

        const earlyReturned = await firstMatchingPromise(wrappedPromises, (v) => !v);

        return earlyReturned !== undefined ? !earlyReturned : false;
    }

    pushState(location: string, state: State): Promise<boolean> {
        this._syncState(state);
        return this._historyFunctions.pushState(location, state);
    }

    replaceState(location: string, state: State): Promise<boolean> {
        this._syncState(state);
        return this._historyFunctions.replaceState(location, state);
    }

    getLocation(): string {
        return this._historyFunctions.getLocation();
    }

    getState(): State {
        return this._historyFunctions.getState();
    }

    forward(): Promise<boolean> {
        return this._historyFunctions.forward();
    }

    back(): Promise<boolean> {
        return this._historyFunctions.back();
    }

    go(delta: number): Promise<boolean> {
        return this._historyFunctions.go(delta);
    }

    block(callback: BlockCallback): () => void {
        return this._historyFunctions.block(callback);
    }

    addPopStateListener(callback: PopStateCallback<State>): () => void {
        return this._historyFunctions.addPopStateListener(callback);
    }
}
