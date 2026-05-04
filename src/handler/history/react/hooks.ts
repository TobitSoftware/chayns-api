import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { HistoryLayer, NavigateOptions, NavigationCommitOptions, BlockOptions, HistoryLayerEvent } from '../types';
import { useHistoryLayerContext } from './HistoryLayerContext';
import { devWarn } from '../guards/devWarn';
import { shallowEqualObj } from '../diff';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Resolves the active HistoryLayer: context first, then
 * `chaynsHost.history.getOwnLayer()` if available, then throws in dev.
 */
export function useHistoryLayer(): HistoryLayer {
    const ctx = useHistoryLayerContext();
    if (ctx) return ctx;

    // Fallback to chaynsHost global if available.
    const globalLayer =
        typeof window !== 'undefined'
            ? (
                  (window as unknown as Record<string, unknown>).__chaynsHost as
                      | { history?: { getOwnLayer?: () => HistoryLayer } }
                      | undefined
              )?.history?.getOwnLayer?.()
            : undefined;

    if (globalLayer) return globalLayer;

    devWarn(
        'NO_LAYER',
        'useHistoryLayer: no HistoryLayer found in context or chaynsHost. Wrap your component with <HistoryLayerProvider>.',
    );
    // Return a dummy layer to avoid crashing outside dev.
    throw new Error(
        '[chaynsHistory] useHistoryLayer must be used inside a <HistoryLayerProvider>.',
    );
}

// ---------------------------------------------------------------------------
// useRoute
// ---------------------------------------------------------------------------

export interface UseRouteResult {
    segments: string[];
    setRoute: (segments: string[], opts?: NavigateOptions) => void;
}

/**
 * Returns the current route segments and a setter for the nearest HistoryLayer.
 * Re-renders only when the segments change.
 */
export function useRoute(): UseRouteResult {
    const layer = useHistoryLayer();

    const getSnapshot = useCallback(() => layer.getRoute(), [layer]);
    const getServerSnapshot = useCallback(() => layer.getRoute(), [layer]);

    // useSyncExternalStore needs stable snapshot references.
    const segRef = useRef<string[]>([]);

    const subscribe = useCallback(
        (notify: () => void) => {
            const unsub1 = layer.addEventListener('change', notify as (e: HistoryLayerEvent) => void);
            const unsub2 = layer.addEventListener('popstate', notify as (e: HistoryLayerEvent) => void);
            return () => { unsub1(); unsub2(); };
        },
        [layer],
    );

    const rawSegments = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    // Memoize array reference to avoid re-renders when content is identical.
    const prev = segRef.current;
    if (
        prev.length !== rawSegments.length ||
        prev.some((s, i) => s !== rawSegments[i])
    ) {
        segRef.current = rawSegments;
    }

    const setRoute = useCallback(
        (segs: string[], opts?: NavigateOptions) => layer.setRoute(segs, opts),
        [layer],
    );

    return { segments: segRef.current, setRoute };
}

// ---------------------------------------------------------------------------
// useHistoryState
// ---------------------------------------------------------------------------

/**
 * Returns the current layer state and a setter.
 * Re-renders only when the own-state changes (shallow comparison performed by layer).
 */
export function useHistoryState<T extends Record<string, unknown> = Record<string, unknown>>(): [
    T | undefined,
    (state: T, opts?: NavigateOptions) => void,
] {
    const layer = useHistoryLayer();

    const stateRef = useRef<T | undefined>(undefined);

    const subscribe = useCallback(
        (notify: () => void) => {
            const unsub1 = layer.addEventListener('change', notify as (e: HistoryLayerEvent) => void);
            const unsub2 = layer.addEventListener('popstate', notify as (e: HistoryLayerEvent) => void);
            return () => { unsub1(); unsub2(); };
        },
        [layer],
    );

    const getSnapshot = useCallback(() => layer.getState<T>(), [layer]);
    const getServerSnapshot = useCallback(() => layer.getState<T>(), [layer]);

    const rawState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    // Stable reference: only update if shallowly different.
    const prev = stateRef.current;
    if (!shallowEqualStateSnapshot(prev, rawState)) {
        stateRef.current = rawState;
    }

    const setState = useCallback(
        (s: T, opts?: NavigateOptions) => layer.setState(s, opts),
        [layer],
    );

    return [stateRef.current, setState];
}

// ---------------------------------------------------------------------------
// useNavigate
// ---------------------------------------------------------------------------

/**
 * Returns a stable `navigate` function for the nearest HistoryLayer.
 */
export function useNavigate(): (
    opts: { route?: string[]; state?: Record<string, unknown> } & NavigateOptions,
) => void {
    const layer = useHistoryLayer();
    return useCallback((opts) => layer.navigate(opts), [layer]);
}

// ---------------------------------------------------------------------------
// useParams
// ---------------------------------------------------------------------------

/**
 * Returns the current query params and a setter for the nearest HistoryLayer.
 * Setter replaces all params on this layer; merge manually if needed:
 * `setParams({ ...params, newKey: 'val' })`.
 * Re-renders only when params change.
 */
export function useParams(): [
    Record<string, string>,
    (params: Record<string, string>, opts?: NavigationCommitOptions) => void,
] {
    const layer = useHistoryLayer();
    const paramsRef = useRef<Record<string, string>>({});

    const subscribe = useCallback(
        (notify: () => void) => {
            const unsub1 = layer.addEventListener('change', notify as (e: HistoryLayerEvent) => void);
            const unsub2 = layer.addEventListener('popstate', notify as (e: HistoryLayerEvent) => void);
            return () => { unsub1(); unsub2(); };
        },
        [layer],
    );

    const getSnapshot = useCallback(() => layer.getParams(), [layer]);
    const getServerSnapshot = useCallback(() => layer.getParams(), [layer]);

    const rawParams = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    if (!shallowEqualObj(paramsRef.current, rawParams)) {
        paramsRef.current = rawParams;
    }

    const setParams = useCallback(
        (p: Record<string, string>, opts?: NavigationCommitOptions) => layer.setParams(p, opts),
        [layer],
    );

    return [paramsRef.current, setParams];
}

// ---------------------------------------------------------------------------
// useHash
// ---------------------------------------------------------------------------

/**
 * Returns the current hash fragment (without `#`) and a setter for the nearest HistoryLayer.
 * Pass `''` to explicitly clear the hash.
 * Re-renders only when the hash changes.
 */
export function useHash(): [string, (hash: string, opts?: NavigationCommitOptions) => void] {
    const layer = useHistoryLayer();

    const subscribe = useCallback(
        (notify: () => void) => {
            const unsub1 = layer.addEventListener('change', notify as (e: HistoryLayerEvent) => void);
            const unsub2 = layer.addEventListener('popstate', notify as (e: HistoryLayerEvent) => void);
            return () => { unsub1(); unsub2(); };
        },
        [layer],
    );

    const getSnapshot = useCallback(() => layer.getHash(), [layer]);
    const getServerSnapshot = useCallback(() => layer.getHash(), [layer]);

    const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const setHash = useCallback(
        (h: string, opts?: NavigationCommitOptions) => layer.setHash(h, opts),
        [layer],
    );

    return [hash, setHash];
}

// ---------------------------------------------------------------------------
// useHistoryBlock
// ---------------------------------------------------------------------------

export interface UseHistoryBlockOptions extends BlockOptions {
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
export function useHistoryBlock(
    callback: () => Promise<boolean>,
    opts: UseHistoryBlockOptions = {},
): void {
    const layer = useHistoryLayer();
    const { isEnabled = true, scope, isBeforeUnload } = opts;

    useEffect(() => {
        if (!isEnabled) return;
        return layer.addBlock(callback, { scope, isBeforeUnload });
    }, [layer, callback, isEnabled, scope, isBeforeUnload]);
}

// ---------------------------------------------------------------------------
// useHistoryEvent
// ---------------------------------------------------------------------------

/**
 * Low-level subscription to `change` or `popstate` events on the nearest layer.
 */
export function useHistoryEvent(
    type: 'change' | 'popstate',
    handler: (e: HistoryLayerEvent) => void,
): void {
    const layer = useHistoryLayer();

    useEffect(() => {
        return layer.addEventListener(type, handler);
    }, [layer, type, handler]);
}

// ---------------------------------------------------------------------------
// useChildLayer
// ---------------------------------------------------------------------------

/**
 * Returns the child layer with the given id, creating it on mount if it
 * doesn't already exist. Does NOT destroy the layer on unmount — the caller
 * must explicitly call `layer.destroyChildLayer(id)` to remove it.
 */
export function useChildLayer(id: string): HistoryLayer {
    const layer = useHistoryLayer();

    // Ensure the child exists synchronously (stable for the lifetime of the component).
    let child = layer.getChildLayer(id);
    if (!child) {
        child = layer.createChildLayer(id);
    }

    return child;
}

// ---------------------------------------------------------------------------
// useActiveChild
// ---------------------------------------------------------------------------

export interface UseActiveChildResult {
    activeChildId: string | null;
    setActiveChild: (
        id: string | null,
        init?: { route?: string[]; state?: Record<string, unknown> },
    ) => void;
}

/**
 * Returns the active child id of the nearest layer and a setter.
 */
export function useActiveChild(): UseActiveChildResult {
    const layer = useHistoryLayer();

    const subscribe = useCallback(
        (notify: () => void) => {
            return layer.addEventListener('change', notify as (e: HistoryLayerEvent) => void);
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

function shallowEqualStateSnapshot<T extends Record<string, unknown>>(
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
export { HistoryLayerProvider, useHistoryLayerContext } from './HistoryLayerContext';
