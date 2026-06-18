export type ChaynsHistoryNavigationCommitOptions = { isReplace?: boolean };

export type ChaynsHistoryNavigateOptions = ChaynsHistoryNavigationCommitOptions & {
    /** Query parameters to set on this layer. Replaces existing params for this layer. */
    params?: Record<string, string>;
    /** URL hash fragment (without leading `#`). Pass `''` to explicitly clear. */
    hash?: string;
};

export type ChaynsHistoryBlockOptions = {
    /** @default 'local' */
    scope?: 'local' | 'global';
    /** @default false */
    isBeforeUnload?: boolean;
};

export type ChaynsHistoryLayerEvent = {
    type: 'change' | 'popstate';
    layerId: string;
    segments: string[];
    state: Record<string, unknown>;
    params: Record<string, string>;
    hash: string;
};

export type ChaynsHistoryActionResult =
    | { isOk: true }
    | { isOk: false; reason: 'blocked' | 'stale' | 'destroyed' | 'error'; error?: unknown };

export type ChaynsHistoryLayerStateNode = {
    activeChild?: string;
    childState?: ChaynsHistoryLayerStateNode;
    /** @internal Reserved — managed by history core. */
    __params?: Record<string, string>;
    /** @internal Reserved — managed by history core. `undefined` = unset, `''` = explicit clear. */
    __hash?: string;
    [key: string]: unknown;
};

export interface ChaynsHistoryLayer {
    readonly id: string;
    readonly depth: number;

    getSegmentCount(): number;
    setSegmentCount(n: number): Promise<void>;

    createChildLayer(id: string): ChaynsHistoryLayer;
    destroyChildLayer(id: string): void;
    setActiveChild(
        id: string | null,
        init?: { route?: string | string[]; state?: Record<string, unknown> },
    ): Promise<ChaynsHistoryActionResult>;
    getActiveChildId(): string | null;
    getChildLayer(id: string): ChaynsHistoryLayer | undefined;

    getRoute(): string[];
    setRoute(route: string | string[], opts?: ChaynsHistoryNavigateOptions): Promise<void>;

    getParams(): Record<string, string>;
    setParams(params: Record<string, string>, opts?: ChaynsHistoryNavigationCommitOptions): Promise<void>;

    getHash(): string;
    setHash(hash: string, opts?: ChaynsHistoryNavigationCommitOptions): Promise<void>;

    getState<T extends object = Record<string, unknown>>(): T | undefined;
    setState<T extends object>(state: T, opts?: ChaynsHistoryNavigateOptions): Promise<void>;

    navigate(opts: {
        route?: string | string[];
        state?: Record<string, unknown>;
        /** Switch the active child as part of this navigation. Auto-creates the child if needed. */
        activeChild?: string | null;
        /** Initial route/state to seed the child with when it is first activated. */
        activeChildInit?: { route?: string | string[]; state?: Record<string, unknown> };
    } & ChaynsHistoryNavigateOptions): Promise<ChaynsHistoryActionResult>;

    addBlock(
        callback: () => Promise<boolean>,
        opts?: ChaynsHistoryBlockOptions,
    ): () => void;

    addEventListener(
        type: 'popstate' | 'change',
        handler: (e: ChaynsHistoryLayerEvent) => void,
    ): () => void;
}
