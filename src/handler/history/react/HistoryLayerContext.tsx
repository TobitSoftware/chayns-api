import React, { createContext, useContext, type FC, type ReactNode } from 'react';
import type { HistoryLayer } from '../types';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import { getOrInitRootLayer } from '../initRootLayer';

// ---------------------------------------------------------------------------
// Module-level layer stack (mirrors moduleWrapper pattern)
// ---------------------------------------------------------------------------

const _layerStack: HistoryLayer[] = [];

export function pushHistoryLayer(layer: HistoryLayer): void {
    _layerStack.push(layer);
}

export function popHistoryLayer(layer: HistoryLayer): void {
    const index = _layerStack.lastIndexOf(layer);
    if (index > -1) {
        _layerStack.splice(index, 1);
    }
}

/** Returns the innermost currently mounted HistoryLayer, or the root layer as fallback. */
export function getCurrentLayer(): HistoryLayer {
    return _layerStack.length > 0
        ? _layerStack[_layerStack.length - 1]
        : getOrInitRootLayer().rootLayer;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const HistoryLayerContext = createContext<HistoryLayer | null>(null);

HistoryLayerContext.displayName = 'HistoryLayerContext';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface HistoryLayerProviderProps {
    layer: HistoryLayer;
    children: ReactNode;
}

export const HistoryLayerProvider: FC<HistoryLayerProviderProps> = ({ layer, children }) => {
    useIsomorphicLayoutEffect(() => {
        pushHistoryLayer(layer);
        return () => popHistoryLayer(layer);
    }, [layer]);

    return (
        <HistoryLayerContext.Provider value={layer}>{children}</HistoryLayerContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

/** Returns the nearest HistoryLayer from context, or null if none. */
export function useHistoryLayerContext(): HistoryLayer | null {
    return useContext(HistoryLayerContext);
}

export default HistoryLayerContext;
