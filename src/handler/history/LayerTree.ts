import type { ChaynsHistoryLayer } from './HistoryLayer';

/**
 * Returns the ordered chain of layers from root to the deepest active layer
 * (inclusive of root).
 */
export function getChaynsHistoryActiveChain(root: ChaynsHistoryLayer): ChaynsHistoryLayer[] {
    const chain: ChaynsHistoryLayer[] = [root];
    let current: ChaynsHistoryLayer = root;
    for (;;) {
        const childId = current.getActiveChildId();
        if (!childId) break;
        const child = current.getChildLayer(childId);
        if (!child) break;
        chain.push(child);
        current = child;
    }
    return chain;
}

/** Depth-first search for a layer by id starting at `root`. */
export function findChaynsHistoryLayerById(
    root: ChaynsHistoryLayer,
    id: string,
): ChaynsHistoryLayer | undefined {
    if (root.id === id) return root;
    for (const child of root._getChildren().values()) {
        const found = findChaynsHistoryLayerById(child, id);
        if (found) return found;
    }
    return undefined;
}

/** Returns true if the layer is reachable via active children from the root. */
export function isInChaynsHistoryActiveChain(layer: ChaynsHistoryLayer): boolean {
    return layer._isInActiveChain();
}
