/**
 * Debug helpers for the chaynsHistory system.
 * Only active when process.env.NODE_ENV !== 'production'.
 */
import type { HistoryLayer } from '../types';
import { HistoryLayer as HistoryLayerClass } from '../HistoryLayer';
import type { NavigationQueue } from '../NavigationQueue';

// ---------------------------------------------------------------------------
// Tree snapshot
// ---------------------------------------------------------------------------

interface LayerDebugNode {
    id: string;
    depth: number;
    segmentCount: number;
    segments: string[];
    state: Record<string, unknown>;
    activeChildId: string | null;
    children: Record<string, LayerDebugNode>;
}

function snapshotLayer(layer: HistoryLayer): LayerDebugNode {
    const node: LayerDebugNode = {
        id: layer.id,
        depth: layer.depth,
        segmentCount: layer.getSegmentCount(),
        segments: layer.getRoute(),
        state: layer.getState() ?? {},
        activeChildId: layer.getActiveChildId(),
        children: {},
    };

    if (layer instanceof HistoryLayerClass) {
        for (const [, child] of layer._getChildren()) {
            node.children[child.id] = snapshotLayer(child);
        }
    }

    return node;
}

/**
 * Returns a plain JSON-serializable snapshot of the full layer tree.
 */
export function debugTree(rootLayer: HistoryLayer): LayerDebugNode {
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
    rootLayer: HistoryLayer,
    queue: NavigationQueue,
): void {
    if (typeof window === 'undefined') return;
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;

    (window as unknown as Record<string, unknown>).__chaynsHistoryInspect = {
        tree: () => debugTree(rootLayer),
        queue: () => debugQueue(queue),
    };
}
