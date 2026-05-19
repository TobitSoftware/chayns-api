import type { ChaynsHistoryLayer } from '../../handler/history/HistoryLayer';
import { getChaynsHistoryActiveChain } from './layerTree';
import { normalizeHistorySegments } from './segments';

/**
 * Concatenates all segments along the active chain into a URL with pathname,
 * merged query params, and the deepest explicitly-set hash.
 */
export function projectToUrl(root: ChaynsHistoryLayer): string {
    const chain = getChaynsHistoryActiveChain(root);
    const parts: string[] = [];
    const mergedParams: Record<string, string> = {};
    let hash: string | undefined;

    for (const layer of chain) {
        for (const seg of normalizeHistorySegments(layer._getOwnSegments())) {
            parts.push(seg);
        }
        Object.assign(mergedParams, layer._getOwnParams());
        const layerHash = layer._getOwnHash();
        if (layerHash !== undefined) hash = layerHash;
    }

    let url = '/' + parts.join('/');
    const search = new URLSearchParams(mergedParams).toString();
    if (search) url += '?' + search;
    if (hash) url += '#' + hash;
    return url;
}

export interface ParseResult {
    /** Maps layer id → segments assigned to that layer. */
    perLayerSegments: Map<string, string[]>;
    /** Segments that could not be assigned to any layer's segmentCount. */
    pendingSegments: string[];
}

/**
 * Splits the incoming URL pathname onto layers based on each layer's `segmentCount`.
 * Traverses the active chain; excess segments go to `pendingSegments`.
 */
export function parseFromUrl(url: string, root: ChaynsHistoryLayer): ParseResult {
    const perLayerSegments = new Map<string, string[]>();

    const pathname = url.startsWith('/') ? url.slice(1) : url;
    const all = pathname ? pathname.split('/') : [];
    let offset = 0;

    const chain = getChaynsHistoryActiveChain(root);
    for (const layer of chain) {
        const count = layer.getSegmentCount();
        const slice = all.slice(offset, offset + count);
        // Pad with empty strings if fewer segments available than segmentCount.
        while (slice.length < count) slice.push('');
        perLayerSegments.set(layer.id, slice);
        offset += count;
    }

    const pendingSegments = offset < all.length ? all.slice(offset) : [];
    return { perLayerSegments, pendingSegments };
}
