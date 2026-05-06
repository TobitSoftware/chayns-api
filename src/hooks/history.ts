import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { ChaynsHistoryLayer, ChaynsHistoryNavigateOptions, ChaynsHistoryNavigationCommitOptions, ChaynsHistoryBlockOptions, ChaynsHistoryLayerEvent } from '../types/history';
import { useChaynsHistoryLayerContext } from '../contexts/HistoryLayerContext';
import { shallowEqualObj } from '../utils/equality';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Resolves the active ChaynsHistoryLayer: context first, then
 * `chaynsHost.history.getOwnLayer()` if available, then throws in dev.
 */
export function useChaynsHistoryLayer(): ChaynsHistoryLayer {
    const ctx = useChaynsHistoryLayerContext();
    if (ctx) return ctx;

    // Fallback to chaynsHost global if available.
    const globalLayer =
        typeof window !== 'undefined'
            ? (
                  (window as unknown as Record<string, unknown>).__chaynsHost as
                      | { history?: { getOwnLayer?: () => ChaynsHistoryLayer } }
                      | undefined
              )?.history?.getOwnLayer?.()
            : undefined;

    if (globalLayer) return globalLayer;

    throw new Error(
        '[chaynsHistory] useChaynsHistoryLayer must be used inside a <ChaynsHistoryLayerProvider>.',
    );
}

// ---------------------------------------------------------------------------
// useChaynsHistoryRoute
// ---------------------------------------------------------------------------

export interface UseChaynsHistoryRouteResult {
    segments: string[];
    setRoute: (route: string | string[], opts?: ChaynsHistoryNavigateOptions) => void;
}

/**
 * Returns the current route segments and a setter for the nearest ChaynsHistoryLayer.
 * Re-renders only when the segments change.
 */
export function useChaynsHistoryRoute(): UseChaynsHistoryRouteResult {
    const layer = useChaynsHistoryLayer();

    // Cached snapshot ref — getSnapshot must return a stable reference between
    // calls when the data hasn't changed, or useSyncExternalStore will loop.
    const segRef = useRef<string[]>([]);

    const getSnapshot = useCallback(() => {
        const next = layer.getRoute();
        const prev = segRef.current;
        if (prev.length === next.length && prev.every((s, i) => s === next[i])) return prev;
        return (segRef.current = next);
    }, [layer]);

    const subscribe = useCallback(
        (notify: () => void) => {
            const unsub1 = layer.addEventListener('change', notify as (e: ChaynsHistoryLayerEvent) => void);
            const unsub2 = layer.addEventListener('popstate', notify as (e: ChaynsHistoryLayerEvent) => void);
            return () => { unsub1(); unsub2(); };
        },
        [layer],
    );

    const segments = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setRoute = useCallback(
        (route: string | string[], opts?: ChaynsHistoryNavigateOptions) => layer.setRoute(route, opts),
        [layer],
    );

    return { segments, setRoute };
}

// ---------------------------------------------------------------------------
// useChaynsHistoryState
// ---------------------------------------------------------------------------

/**
 * Returns the current layer state and a setter.
 * Re-renders only when the own-state changes (shallow comparison performed by layer).
 */
export function useChaynsHistoryState<T extends object = Record<string, unknown>>(): [
    T | undefined,
    (state: T, opts?: ChaynsHistoryNavigateOptions) => void,
] {
    const layer = useChaynsHistoryLayer();

    const stateRef = useRef<T | undefined>(undefined);

    const getSnapshot = useCallback(() => {
        const next = layer.getState<T>();
        if (shallowEqualStateSnapshot(stateRef.current, next)) return stateRef.current;
        return (stateRef.current = next);
    }, [layer]);

    const subscribe = useCallback(
        (notify: () => void) => {
            const unsub1 = layer.addEventListener('change', notify as (e: ChaynsHistoryLayerEvent) => void);
            const unsub2 = layer.addEventListener('popstate', notify as (e: ChaynsHistoryLayerEvent) => void);
            return () => { unsub1(); unsub2(); };
        },
        [layer],
    );

    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setState = useCallback(
        (s: T, opts?: ChaynsHistoryNavigateOptions) => layer.setState(s, opts),
        [layer],
    );

    return [state, setState];
}

// ---------------------------------------------------------------------------
// useChaynsHistoryNavigate
// ---------------------------------------------------------------------------

/**
 * Returns a stable `navigate` function for the nearest ChaynsHistoryLayer.
 */
export function useChaynsHistoryNavigate(): (
    opts: {
        route?: string | string[];
        state?: Record<string, unknown>;
        /** Switch the active child as part of this navigation. Auto-creates the child if needed. */
        activeChild?: string | null;
        /** Initial route/state to seed the child with when it is first activated. */
        activeChildInit?: { route?: string | string[]; state?: Record<string, unknown> };
    } & ChaynsHistoryNavigateOptions,
) => void {
    const layer = useChaynsHistoryLayer();
    return useCallback((opts) => layer.navigate(opts), [layer]);
}

// ---------------------------------------------------------------------------
// useChaynsHistoryParams
// ---------------------------------------------------------------------------

/**
 * Returns the current query params and a setter for the nearest ChaynsHistoryLayer.
 * Setter replaces all params on this layer; merge manually if needed:
 * `setParams({ ...params, newKey: 'val' })`.
 * Re-renders only when params change.
 */
export function useChaynsHistoryParams(): [
    Record<string, string>,
    (params: Record<string, string>, opts?: ChaynsHistoryNavigationCommitOptions) => void,
] {
    const layer = useChaynsHistoryLayer();
    const paramsRef = useRef<Record<string, string>>({});

    const getSnapshot = useCallback(() => {
        const next = layer.getParams();
        if (shallowEqualObj(paramsRef.current, next)) return paramsRef.current;
        return (paramsRef.current = next);
    }, [layer]);

    const subscribe = useCallback(
        (notify: () => void) => {
            const unsub1 = layer.addEventListener('change', notify as (e: ChaynsHistoryLayerEvent) => void);
            const unsub2 = layer.addEventListener('popstate', notify as (e: ChaynsHistoryLayerEvent) => void);
            return () => { unsub1(); unsub2(); };
        },
        [layer],
    );

    const params = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setParams = useCallback(
        (p: Record<string, string>, opts?: ChaynsHistoryNavigationCommitOptions) => layer.setParams(p, opts),
        [layer],
    );

    return [params, setParams];
}

// ---------------------------------------------------------------------------
// useChaynsHistoryHash
// ---------------------------------------------------------------------------

/**
 * Returns the current hash fragment (without `#`) and a setter for the nearest ChaynsHistoryLayer.
 * Pass `''` to explicitly clear the hash.
 * Re-renders only when the hash changes.
 */
export function useChaynsHistoryHash(): [string, (hash: string, opts?: ChaynsHistoryNavigationCommitOptions) => void] {
    const layer = useChaynsHistoryLayer();

    const subscribe = useCallback(
        (notify: () => void) => {
            const unsub1 = layer.addEventListener('change', notify as (e: ChaynsHistoryLayerEvent) => void);
            const unsub2 = layer.addEventListener('popstate', notify as (e: ChaynsHistoryLayerEvent) => void);
            return () => { unsub1(); unsub2(); };
        },
        [layer],
    );

    const getSnapshot = useCallback(() => layer.getHash(), [layer]);
    const getServerSnapshot = useCallback(() => layer.getHash(), [layer]);

    const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const setHash = useCallback(
        (h: string, opts?: ChaynsHistoryNavigationCommitOptions) => layer.setHash(h, opts),
        [layer],
    );

    return [hash, setHash];
}

// ---------------------------------------------------------------------------
// useChaynsHistoryBlock
// ---------------------------------------------------------------------------

export interface UseChaynsHistoryBlockOptions extends ChaynsHistoryBlockOptions {
    /** Only register the block when true. Default: true. */
    isEnabled?: boolean;
}

/**
 * Registers a navigation blocker. The callback must return a Promise<boolean>:
 * true = allow, false = block.
 *
 * The caller is responsible for providing a stable `callback` reference
 * (e.g. via useCallback) — registrations only change when the reference changes.
 * `scope` and `isBeforeUnload` are read when the block is registered; changes
 * after mount are applied on the next registration cycle.
 */
export function useChaynsHistoryBlock(
    callback: () => Promise<boolean>,
    opts: UseChaynsHistoryBlockOptions = {},
): void {
    const layer = useChaynsHistoryLayer();
    const { isEnabled = true, scope, isBeforeUnload } = opts;

    useEffect(() => {
        if (!isEnabled) return;
        return layer.addBlock(callback, { scope, isBeforeUnload });
    }, [layer, callback, isEnabled, scope, isBeforeUnload]);
}

// ---------------------------------------------------------------------------
// useChaynsHistoryEvent
// ---------------------------------------------------------------------------

/**
 * Low-level subscription to `change` or `popstate` events on the nearest layer.
 */
export function useChaynsHistoryEvent(
    type: 'change' | 'popstate',
    handler: (e: ChaynsHistoryLayerEvent) => void,
): void {
    const layer = useChaynsHistoryLayer();

    useEffect(() => {
        return layer.addEventListener(type, handler);
    }, [layer, type, handler]);
}

// ---------------------------------------------------------------------------
// useChaynsHistoryChildLayer
// ---------------------------------------------------------------------------

/**
 * Returns the child layer with the given id, creating it on mount if it
 * doesn't already exist. Does NOT destroy the layer on unmount — the caller
 * must explicitly call `layer.destroyChildLayer(id)` to remove it.
 */
export function useChaynsHistoryChildLayer(id: string): ChaynsHistoryLayer {
    const layer = useChaynsHistoryLayer();

    // Ensure the child exists synchronously (stable for the lifetime of the component).
    let child = layer.getChildLayer(id);
    if (!child) {
        child = layer.createChildLayer(id);
    }

    return child;
}

// ---------------------------------------------------------------------------
// useChaynsHistoryActiveChild
// ---------------------------------------------------------------------------

export interface UseChaynsHistoryActiveChildResult {
    activeChildId: string | null;
    setActiveChild: (
        id: string | null,
        init?: { route?: string[]; state?: Record<string, unknown> },
    ) => void;
}

/**
 * Returns the active child id of the nearest layer and a setter.
 */
export function useChaynsHistoryActiveChild(): UseChaynsHistoryActiveChildResult {
    const layer = useChaynsHistoryLayer();

    const subscribe = useCallback(
        (notify: () => void) => {
            return layer.addEventListener('change', notify as (e: ChaynsHistoryLayerEvent) => void);
        },
        [layer],
    );

    const getSnapshot = useCallback(() => layer.getActiveChildId(), [layer]);

    const activeChildId = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setActiveChild = useCallback(
        (
            id: string | null,
            init?: { route?: string[]; state?: Record<string, unknown> },
        ) => layer.setActiveChild(id, init),
        [layer],
    );

    return { activeChildId, setActiveChild };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function shallowEqualStateSnapshot<T extends object>(
    a: T | undefined,
    b: T | undefined,
): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
        if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
    }
    return true;
}

// Re-export context pieces for convenience.
export { ChaynsHistoryLayerProvider, useChaynsHistoryLayerContext } from '../contexts/HistoryLayerContext';
