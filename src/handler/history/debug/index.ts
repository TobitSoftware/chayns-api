/**
 * Debug helpers for the chaynsHistory system.
 * Only active when process.env.NODE_ENV !== 'production'.
 */
import type { ChaynsHistoryLayer } from '../types';
import { ChaynsHistoryLayer as ChaynsHistoryLayerClass } from '../HistoryLayer';
import type { NavigationQueue } from '../NavigationQueue';

// ---------------------------------------------------------------------------
// Tree snapshot
// ---------------------------------------------------------------------------

interface ChaynsHistoryLayerDebugNode {
    id: string;
    depth: number;
    segmentCount: number;
    segments: string[];
    state: Record<string, unknown>;
    activeChildId: string | null;
    children: Record<string, ChaynsHistoryLayerDebugNode>;
}

function snapshotLayer(layer: ChaynsHistoryLayer): ChaynsHistoryLayerDebugNode {
    const node: ChaynsHistoryLayerDebugNode = {
        id: layer.id,
        depth: layer.depth,
        segmentCount: layer.getSegmentCount(),
        segments: layer.getRoute(),
        state: layer.getState() ?? {},
        activeChildId: layer.getActiveChildId(),
        children: {},
    };

    if (layer instanceof ChaynsHistoryLayerClass) {
        for (const [, child] of layer._getChildren()) {
            node.children[child.id] = snapshotLayer(child);
        }
    }

    return node;
}

/**
 * Returns a plain JSON-serializable snapshot of the full layer tree.
 */
export function debugTree(rootLayer: ChaynsHistoryLayer): ChaynsHistoryLayerDebugNode {
    return snapshotLayer(rootLayer);
}

/**
 * Returns the pending navigation ops in the queue.
 */
export function debugQueue(queue: NavigationQueue): unknown[] {
    return queue._debugQueueSnapshot();
}

// ---------------------------------------------------------------------------
// Optional: window global for browser console
// ---------------------------------------------------------------------------

export function installWindowDebugGlobal(
    rootLayer: ChaynsHistoryLayer,
    queue: NavigationQueue,
): void {
    if (typeof window === 'undefined') return;
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;

    (window as unknown as Record<string, unknown>).__chaynsHistoryInspect = {
        tree: () => debugTree(rootLayer),
        queue: () => debugQueue(queue),
    };
}
