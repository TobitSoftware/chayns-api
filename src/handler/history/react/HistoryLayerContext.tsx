import React, { createContext, useContext, type FC, type ReactNode } from 'react';
import type { ChaynsHistoryLayer } from '../types';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import { getOrInitRootChaynsHistoryLayer } from '../initRootLayer';

// ---------------------------------------------------------------------------
// Module-level layer stack (mirrors moduleWrapper pattern)
// ---------------------------------------------------------------------------

const _layerStack: ChaynsHistoryLayer[] = [];

export function pushChaynsHistoryLayer(layer: ChaynsHistoryLayer): void {
    _layerStack.push(layer);
}

export function popChaynsHistoryLayer(layer: ChaynsHistoryLayer): void {
    const index = _layerStack.lastIndexOf(layer);
    if (index > -1) {
        _layerStack.splice(index, 1);
    }
}

/** Returns the innermost currently mounted ChaynsHistoryLayer, or the root layer as fallback. */
export function getCurrentChaynsHistoryLayer(): ChaynsHistoryLayer {
    return _layerStack.length > 0
        ? _layerStack[_layerStack.length - 1]
        : getOrInitRootChaynsHistoryLayer().rootLayer;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ChaynsHistoryLayerContext = createContext<ChaynsHistoryLayer | null>(null);

ChaynsHistoryLayerContext.displayName = 'ChaynsHistoryLayerContext';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface ChaynsHistoryLayerProviderProps {
    layer: ChaynsHistoryLayer;
    children: ReactNode;
}

/**
 * Provides a ChaynsHistoryLayer to the React subtree **and** registers it on the
 * module-level layer stack so that `getCurrentChaynsHistoryLayer()` (static / non-React
 * call sites) also sees this layer as the current one.
 *
 * Use `ChaynsHistoryLayerOverrideProvider` instead if you only want to override the
 * React context without affecting static call sites.
 */
export const ChaynsHistoryLayerProvider: FC<ChaynsHistoryLayerProviderProps> = ({ layer, children }) => {
    useIsomorphicLayoutEffect(() => {
        pushChaynsHistoryLayer(layer);
        return () => popChaynsHistoryLayer(layer);
    }, [layer]);

    return (
        <ChaynsHistoryLayerContext.Provider value={layer}>{children}</ChaynsHistoryLayerContext.Provider>
    );
};

/**
 * Overrides the ChaynsHistoryLayer for the React subtree **only** — hooks such as
 * `useChaynsHistoryLayer`, `useChaynsHistoryRoute`, `useChaynsHistoryNavigate`, etc. will resolve to the
 * provided `layer`, but `getCurrentChaynsHistoryLayer()` (the static / non-React accessor
 * that reads from the module-level layer stack) is left unchanged.
 *
 * This is useful when you need to scope history to a specific layer inside a
 * React tree without affecting imperative call sites outside that tree.
 */
export const ChaynsHistoryLayerOverrideProvider: FC<ChaynsHistoryLayerProviderProps> = ({ layer, children }) => (
    <ChaynsHistoryLayerContext.Provider value={layer}>{children}</ChaynsHistoryLayerContext.Provider>
);

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

/** Returns the nearest ChaynsHistoryLayer from context, or null if none. */
export function useChaynsHistoryLayerContext(): ChaynsHistoryLayer | null {
    return useContext(ChaynsHistoryLayerContext);
}

export default ChaynsHistoryLayerContext;
