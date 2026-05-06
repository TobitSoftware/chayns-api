import { describe, it, expect } from 'vitest';
import {
    hasChaynsHistoryState,
    projectToState,
    applyStateToTree,
    diffIncomingState,
} from '../../src/utils/history/stateProjector';
import { makeTestTree } from './helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rawState(tree: Record<string, unknown>) {
    return { __chaynsHistory: { v: 1, tree } };
}

// ---------------------------------------------------------------------------
// hasChaynsHistoryState
// ---------------------------------------------------------------------------

describe('hasChaynsHistoryState', () => {
    it('returns false for null', () => {
        expect(hasChaynsHistoryState(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(hasChaynsHistoryState(undefined)).toBe(false);
    });

    it('returns false for a primitive', () => {
        expect(hasChaynsHistoryState('string')).toBe(false);
        expect(hasChaynsHistoryState(42)).toBe(false);
    });

    it('returns false when __chaynsHistory key is absent', () => {
        expect(hasChaynsHistoryState({ foo: 'bar' })).toBe(false);
    });

    it('returns false when __chaynsHistory has no tree property', () => {
        expect(hasChaynsHistoryState({ __chaynsHistory: { v: 1 } })).toBe(false);
    });

    it('returns true for a valid state object', () => {
        expect(hasChaynsHistoryState(rawState({}))).toBe(true);
    });

    it('returns true even for a tree with arbitrary content', () => {
        expect(hasChaynsHistoryState(rawState({ page: 'home', count: 3 }))).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// projectToState
// ---------------------------------------------------------------------------

describe('projectToState', () => {
    it('includes a __chaynsHistory key with version and tree', () => {
        const { root } = makeTestTree();
        const state = projectToState(root);
        expect(state).toHaveProperty('__chaynsHistory');
        expect((state.__chaynsHistory as any).v).toBe(1);
        expect((state.__chaynsHistory as any).tree).toBeDefined();
    });

    it('preserves foreign keys from the existing state object', () => {
        const { root } = makeTestTree();
        const state = projectToState(root, { otherLib: { value: 42 } });
        expect(state).toHaveProperty('otherLib', { value: 42 });
    });

    it('overrides stale __chaynsHistory in existing state', () => {
        const { root } = makeTestTree();
        const old = { __chaynsHistory: { v: 0, tree: { page: 'old' } } };
        const state = projectToState(root, old);
        expect((state.__chaynsHistory as any).tree.page).toBeUndefined();
    });

    it('serializes own state into the tree node', () => {
        const { root } = makeTestTree();
        root._setOwnStateSilent({ page: 'home' });
        const state = projectToState(root);
        expect((state.__chaynsHistory as any).tree.page).toBe('home');
    });

    it('includes __params in tree node when params are non-empty', () => {
        const { root } = makeTestTree();
        root._setOwnParamsSilent({ q: 'search' });
        const state = projectToState(root);
        expect((state.__chaynsHistory as any).tree.__params).toEqual({ q: 'search' });
    });

    it('omits __params from tree node when params are empty', () => {
        const { root } = makeTestTree();
        const state = projectToState(root);
        expect((state.__chaynsHistory as any).tree.__params).toBeUndefined();
    });

    it('includes __hash in tree node when explicitly set', () => {
        const { root } = makeTestTree();
        root._setOwnHashSilent('section1');
        const state = projectToState(root);
        expect((state.__chaynsHistory as any).tree.__hash).toBe('section1');
    });

    it('omits __hash from tree node when hash is undefined (never set)', () => {
        const { root } = makeTestTree();
        const state = projectToState(root);
        expect((state.__chaynsHistory as any).tree).not.toHaveProperty('__hash');
    });

    it('includes empty string hash when explicitly cleared', () => {
        const { root } = makeTestTree();
        root._setOwnHashSilent('');
        const state = projectToState(root);
        expect((state.__chaynsHistory as any).tree.__hash).toBe('');
    });

    it('serializes active child and its state recursively', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('nav');
        root._setActiveChildSilent('nav');
        child._setOwnStateSilent({ view: 'list' });

        const state = projectToState(root);
        const tree = (state.__chaynsHistory as any).tree;
        expect(tree.activeChild).toBe('nav');
        expect(tree.childState.view).toBe('list');
    });

    it('does not include activeChild when none is set', () => {
        const { root } = makeTestTree();
        const state = projectToState(root);
        expect((state.__chaynsHistory as any).tree.activeChild).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// applyStateToTree
// ---------------------------------------------------------------------------

describe('applyStateToTree', () => {
    it('returns empty changedLayerIds for null state', () => {
        const { root } = makeTestTree();
        const { changedLayerIds } = applyStateToTree(root, null);
        expect(changedLayerIds.size).toBe(0);
    });

    it('returns empty changedLayerIds for state without __chaynsHistory', () => {
        const { root } = makeTestTree();
        const { changedLayerIds } = applyStateToTree(root, { foo: 'bar' });
        expect(changedLayerIds.size).toBe(0);
    });

    it('applies own state changes and marks the layer as changed', () => {
        const { root } = makeTestTree();
        const { changedLayerIds } = applyStateToTree(root, rawState({ page: 'about' }));
        expect(changedLayerIds.has('root')).toBe(true);
        expect(root._getOwnState()).toEqual({ page: 'about' });
    });

    it('does not mark layer as changed when state is identical', () => {
        const { root } = makeTestTree();
        root._setOwnStateSilent({ page: 'home' });
        const { changedLayerIds } = applyStateToTree(root, rawState({ page: 'home' }));
        expect(changedLayerIds.size).toBe(0);
    });

    it('applies params from state', () => {
        const { root } = makeTestTree();
        applyStateToTree(root, rawState({ __params: { q: 'test' } }));
        expect(root._getOwnParams()).toEqual({ q: 'test' });
    });

    it('marks layer as changed when params differ', () => {
        const { root } = makeTestTree();
        const { changedLayerIds } = applyStateToTree(root, rawState({ __params: { q: 'new' } }));
        expect(changedLayerIds.has('root')).toBe(true);
    });

    it('applies hash from state', () => {
        const { root } = makeTestTree();
        applyStateToTree(root, rawState({ __hash: 'section' }));
        expect(root._getOwnHash()).toBe('section');
    });

    it('marks layer as changed when hash differs', () => {
        const { root } = makeTestTree();
        const { changedLayerIds } = applyStateToTree(root, rawState({ __hash: 'intro' }));
        expect(changedLayerIds.has('root')).toBe(true);
    });

    it('applies active child and child state recursively', () => {
        const { root } = makeTestTree();
        root.createChildLayer('nav');

        applyStateToTree(
            root,
            rawState({ activeChild: 'nav', childState: { view: 'grid' } }),
        );

        expect(root.getActiveChildId()).toBe('nav');
        expect(root.getChildLayer('nav')!._getOwnState()).toEqual({ view: 'grid' });
    });

    it('sets activeChildId to null when activeChild is absent from state', () => {
        const { root } = makeTestTree();
        root._setActiveChildSilent('nav');

        applyStateToTree(root, rawState({}));

        expect(root.getActiveChildId()).toBeNull();
    });

    it('marks layer as changed when activeChild changes', () => {
        const { root } = makeTestTree();
        root.createChildLayer('nav');
        root._setActiveChildSilent(null);

        const { changedLayerIds } = applyStateToTree(
            root,
            rawState({ activeChild: 'nav' }),
        );
        expect(changedLayerIds.has('root')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// diffIncomingState
// ---------------------------------------------------------------------------

describe('diffIncomingState', () => {
    it('returns empty set for invalid state', () => {
        const { root } = makeTestTree();
        expect(diffIncomingState(root, null).changedLayerIds.size).toBe(0);
        expect(diffIncomingState(root, {}).changedLayerIds.size).toBe(0);
    });

    it('detects state changes without mutating the tree', () => {
        const { root } = makeTestTree();
        root._setOwnStateSilent({ page: 'home' });

        const { changedLayerIds } = diffIncomingState(root, rawState({ page: 'about' }));

        expect(changedLayerIds.has('root')).toBe(true);
        // Tree must NOT be mutated
        expect(root._getOwnState()).toEqual({ page: 'home' });
    });

    it('returns empty set when state is identical to current tree', () => {
        const { root } = makeTestTree();
        root._setOwnStateSilent({ page: 'home' });

        const { changedLayerIds } = diffIncomingState(root, rawState({ page: 'home' }));
        expect(changedLayerIds.size).toBe(0);
    });

    it('detects param changes without mutating', () => {
        const { root } = makeTestTree();
        root._setOwnParamsSilent({ q: 'old' });

        const { changedLayerIds } = diffIncomingState(root, rawState({ __params: { q: 'new' } }));
        expect(changedLayerIds.has('root')).toBe(true);
        expect(root._getOwnParams()).toEqual({ q: 'old' });
    });

    it('detects hash changes without mutating', () => {
        const { root } = makeTestTree();
        root._setOwnHashSilent('old');

        const { changedLayerIds } = diffIncomingState(root, rawState({ __hash: 'new' }));
        expect(changedLayerIds.has('root')).toBe(true);
        expect(root._getOwnHash()).toBe('old');
    });

    it('detects changes in nested child layers', () => {
        const { root } = makeTestTree();
        root.createChildLayer('nav');
        root._setActiveChildSilent('nav');

        const { changedLayerIds } = diffIncomingState(
            root,
            rawState({ activeChild: 'nav', childState: { view: 'grid' } }),
        );

        expect(changedLayerIds.has('nav')).toBe(true);
    });
});

