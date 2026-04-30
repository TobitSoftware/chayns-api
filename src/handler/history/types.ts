export type NavigationCommitOptions = { isReplace?: boolean };

export type NavigateOptions = NavigationCommitOptions & {
    /** Query parameters to set on this layer. Replaces existing params for this layer. */
    params?: Record<string, string>;
    /** URL hash fragment (without leading `#`). Pass `''` to explicitly clear. */
    hash?: string;
};

export type BlockOptions = {
    /** @default 'local' */
    scope?: 'local' | 'global';
    /** @default false */
    isBeforeUnload?: boolean;
};

export type HistoryLayerEvent = {
    type: 'change' | 'popstate';
    layerId: string;
    segments: string[];
    state: Record<string, unknown> | undefined;
    params: Record<string, string>;
    hash: string;
};

export type LayerStateNode = {
    activeChild?: string;
    childState?: LayerStateNode;
    /** @internal Reserved — managed by history core. */
    __params?: Record<string, string>;
    /** @internal Reserved — managed by history core. `undefined` = unset, `''` = explicit clear. */
    __hash?: string;
    [key: string]: unknown;
};

export interface HistoryLayer {
    readonly id: string;
    readonly depth: number;

    getSegmentCount(): number;
    setSegmentCount(n: number): void;

    createChildLayer(id: string): HistoryLayer;
    destroyChildLayer(id: string): void;
    setActiveChild(
        id: string | null,
        init?: { route?: string[]; state?: Record<string, unknown> },
    ): void;
    getActiveChildId(): string | null;
    getChildLayer(id: string): HistoryLayer | undefined;

    getRoute(): string[];
    setRoute(segments: string[], opts?: NavigateOptions): void;

    getParams(): Record<string, string>;
    setParams(params: Record<string, string>, opts?: NavigationCommitOptions): void;

    getHash(): string;
    setHash(hash: string, opts?: NavigationCommitOptions): void;

    getState<T = Record<string, unknown>>(): T | undefined;
    setState<T extends Record<string, unknown>>(state: T, opts?: NavigateOptions): void;

    navigate(opts: { route?: string[]; state?: Record<string, unknown> } & NavigateOptions): void;

    addBlock(
        callback: () => Promise<boolean>,
        opts?: BlockOptions,
    ): () => void;

    addEventListener(
        type: 'popstate' | 'change',
        handler: (e: HistoryLayerEvent) => void,
    ): () => void;
}
