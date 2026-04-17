export type BlockCallback = () => void | Promise<void>;
/** Return `true` to block the navigation, `false` to allow it. */
export type PopStateCallback<State> = (state?: State, previousState?: State) => Promise<boolean>;

/** Low-level history operations injected into a ChaynsHistoryHandler. */
export interface HistoryFunctions<State extends BaseHistoryState> {
    pushState(location: string, state: State): Promise<boolean>;

    replaceState(location: string, state: State): Promise<boolean>;

    getLocation(): string;

    getState(): State;

    forward(): Promise<boolean>;

    /** When `index === 0`, `callback` is invoked instead of `window.history.back`. */
    back(callback?: () => void | Promise<void>): Promise<boolean>;

    go(delta: number): Promise<boolean>;

    /** Register a navigation block. Returns a cleanup function that removes the block. */
    block(callback: BlockCallback): () => void;

    /** Subscribe to popstate events. Returns a cleanup function that unsubscribes. */
    addPopStateListener(callback: PopStateCallback<State>): () => void;
}

export interface BaseHistoryState {
    /** Which child handler is currently active on this level. */
    activeId?: string | number | null;
    /**
     * The path segment index where this handler's own route begins.
     * `-1` means the handler owns the full path.
     */
    safeRouteIndex?: number;
    /** Nested state for the active child handler. */
    childState?: BaseHistoryState;
}

export interface RootState extends BaseHistoryState {
    safeRouteIndex: -1;
    /** Monotonically increasing counter used to determine forward/back direction. */
    index: number;
}

export interface IChaynsHistoryHandler<State extends BaseHistoryState = BaseHistoryState> extends HistoryFunctions<State> {
    createChild<ChildState extends BaseHistoryState = BaseHistoryState>(id: string | number, initialState: ChildState): IChaynsHistoryHandler<ChildState>;
}
