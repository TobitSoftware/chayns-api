import type { ChaynsHistoryLayer } from '../../handler/history/HistoryLayer';
import type { ChaynsHistoryLayerStateNode } from '../../types/history';
import { shallowEqualArr, shallowEqualObj } from '../equality';

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const ROOT_KEY = '__chaynsHistory';
const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Project tree → history state
// ---------------------------------------------------------------------------

/**
 * Recursively builds a `ChaynsHistoryLayerStateNode` for `layer` and all its active descendants.
 */
function buildNode(layer: ChaynsHistoryLayer): ChaynsHistoryLayerStateNode {
    const node: ChaynsHistoryLayerStateNode = { ...layer._getOwnState() };

    const params = layer._getOwnParams();
    if (Object.keys(params).length > 0) node.__params = { ...params };

    const hash = layer._getOwnHash();
    // Only serialize hash if it was explicitly set (not undefined/unset).
    if (hash !== undefined) node.__hash = hash;

    const activeChildId = layer.getActiveChildId();
    if (activeChildId) {
        node.activeChild = activeChildId;
        const child = layer.getChildLayer(activeChildId);
        if (child) {
            node.childState = buildNode(child);
        }
    }
    return node;
}

/**
 * Returns the value to store in `window.history.state`, merging with any
 * pre-existing foreign keys so we never overwrite other consumers' state.
 */
export function projectToState(
    root: ChaynsHistoryLayer,
    existing: Record<string, unknown> = {},
): Record<string, unknown> {
    const tree = buildNode(root);
    return {
        ...existing,
        [ROOT_KEY]: {
            v: SCHEMA_VERSION,
            tree,
        },
    };
}

// ---------------------------------------------------------------------------
// Apply incoming state → tree (mutating)
// ---------------------------------------------------------------------------

/**
 * Recursively applies a `ChaynsHistoryLayerStateNode` onto the layer tree.
 * Only mutates layers that exist in the current tree; unknown layers are skipped.
 */
function applyNode(layer: ChaynsHistoryLayer, node: ChaynsHistoryLayerStateNode): void {
    const { activeChild, childState, __params, __hash, ...ownProps } = node;
    layer._setOwnStateSilent(ownProps as Record<string, unknown>);
    layer._setOwnParamsSilent(__params ?? {});
    // __hash absent = unset (undefined), present = explicitly set (including '')
    layer._setOwnHashSilent('__hash' in node ? __hash : undefined);

    if (activeChild !== undefined) {
        layer._setActiveChildSilent(activeChild);
        if (childState) {
            const child = layer.getChildLayer(activeChild);
            if (child) applyNode(child, childState);
        }
    } else {
        layer._setActiveChildSilent(null);
    }
}

/**
 * Applies the raw `window.history.state` payload onto the layer tree.
 * Returns the set of layer ids whose segments OR ownState changed.
 */
export function applyStateToTree(
    root: ChaynsHistoryLayer,
    raw: unknown,
): { changedLayerIds: Set<string> } {
    const node = extractNode(raw);
    if (!node) return { changedLayerIds: new Set() };

    const changedLayerIds = new Set<string>();
    applyNodeTracked(root, node, changedLayerIds);
    return { changedLayerIds };
}

/**
 * Like `applyStateToTree` but does NOT mutate the tree.
 * Returns layer ids that WOULD change if the state were applied.
 */
export function diffIncomingState(
    root: ChaynsHistoryLayer,
    raw: unknown,
): { changedLayerIds: Set<string> } {
    const node = extractNode(raw);
    if (!node) return { changedLayerIds: new Set() };

    const changedLayerIds = new Set<string>();
    diffNodeTracked(root, node, changedLayerIds);
    return { changedLayerIds };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractNode(raw: unknown): ChaynsHistoryLayerStateNode | null {
    if (!raw || typeof raw !== 'object') return null;
    const entry = (raw as Record<string, unknown>)[ROOT_KEY];
    if (!entry || typeof entry !== 'object') return null;
    const { tree } = entry as { tree?: ChaynsHistoryLayerStateNode };
    return tree ?? null;
}

function applyNodeTracked(
    layer: ChaynsHistoryLayer,
    node: ChaynsHistoryLayerStateNode,
    changed: Set<string>,
): void {
    const { activeChild, childState, __params, __hash, ...ownProps } = node;

    const prevState = layer._getOwnState();
    const prevActiveChild = layer.getActiveChildId();
    const prevParams = layer._getOwnParams();
    const prevHash = layer._getOwnHash();

    const incomingParams = __params ?? {};
    const incomingHash: string | undefined = '__hash' in node ? __hash : undefined;

    const ownPropsClean = ownProps as Record<string, unknown>;
    const stateChanged = !shallowEqualObj(prevState, ownPropsClean);
    const activeChildChanged = prevActiveChild !== (activeChild ?? null);
    const paramsChanged = !shallowEqualObj(prevParams, incomingParams);
    const hashChanged = prevHash !== incomingHash;

    layer._setOwnStateSilent(ownPropsClean);
    layer._setActiveChildSilent(activeChild ?? null);
    layer._setOwnParamsSilent(incomingParams);
    layer._setOwnHashSilent(incomingHash);

    if (stateChanged || activeChildChanged || paramsChanged || hashChanged) {
        changed.add(layer.id);
    }

    if (activeChild && childState) {
        const child = layer.getChildLayer(activeChild);
        if (child) applyNodeTracked(child, childState, changed);
    }
}

function diffNodeTracked(
    layer: ChaynsHistoryLayer,
    node: ChaynsHistoryLayerStateNode,
    changed: Set<string>,
): void {
    const { activeChild, childState, __params, __hash, ...ownProps } = node;

    const prevState = layer._getOwnState();
    const prevActiveChild = layer.getActiveChildId();
    const prevParams = layer._getOwnParams();
    const prevHash = layer._getOwnHash();

    const incomingParams = __params ?? {};
    const incomingHash: string | undefined = '__hash' in node ? __hash : undefined;

    const ownPropsClean = ownProps as Record<string, unknown>;
    const stateChanged = !shallowEqualObj(prevState, ownPropsClean);
    const activeChildChanged = prevActiveChild !== (activeChild ?? null);
    const paramsChanged = !shallowEqualObj(prevParams, incomingParams);
    const hashChanged = prevHash !== incomingHash;

    if (stateChanged || activeChildChanged || paramsChanged || hashChanged) {
        changed.add(layer.id);
    }

    if (activeChild && childState) {
        const child = layer.getChildLayer(activeChild);
        if (child) diffNodeTracked(child, childState, changed);
    }
}

// Also compare segments — StateProjector doesn't own segments, but we need
// to know if incoming URL changed any layer's segments. That diff lives in
// UrlProjector / NavigationQueue. This file only handles the history state blob.

export { extractNode as _extractNode };

export function hasChaynsHistoryState(raw: unknown): boolean {
    return extractNode(raw) !== null;
}
