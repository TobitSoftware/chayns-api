import { describe, it, expect } from 'vitest';
import { getChaynsHistoryActiveChain, findChaynsHistoryLayerById, isInChaynsHistoryActiveChain } from '../../src/utils/history/layerTree';
import { makeTestTree } from './helpers';

describe('getChaynsHistoryActiveChain', () => {
    it('returns array containing only root when no active child is set', () => {
        const { root } = makeTestTree();
        const chain = getChaynsHistoryActiveChain(root);
        expect(chain).toHaveLength(1);
        expect(chain[0].id).toBe('root');
    });

    it('includes active child in the chain', () => {
        const { root } = makeTestTree();
        root.createChildLayer('nav');
        root._setActiveChildSilent('nav');

        const chain = getChaynsHistoryActiveChain(root);
        expect(chain).toHaveLength(2);
        expect(chain[0].id).toBe('root');
        expect(chain[1].id).toBe('nav');
    });

    it('traverses nested active children', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('level1');
        child.createChildLayer('level2');
        root._setActiveChildSilent('level1');
        child._setActiveChildSilent('level2');

        const chain = getChaynsHistoryActiveChain(root);
        expect(chain.map((l) => l.id)).toEqual(['root', 'level1', 'level2']);
    });

    it('stops traversal when active child id is not found in children', () => {
        const { root } = makeTestTree();
        root._setActiveChildSilent('ghost'); // no such child created

        const chain = getChaynsHistoryActiveChain(root);
        expect(chain).toHaveLength(1);
        expect(chain[0].id).toBe('root');
    });

    it('returns layers in order from root to deepest', () => {
        const { root } = makeTestTree();
        const a = root.createChildLayer('a');
        const b = a.createChildLayer('b');
        b.createChildLayer('c');
        root._setActiveChildSilent('a');
        a._setActiveChildSilent('b');
        b._setActiveChildSilent('c');

        const ids = getChaynsHistoryActiveChain(root).map((l) => l.id);
        expect(ids).toEqual(['root', 'a', 'b', 'c']);
    });
});

describe('findChaynsHistoryLayerById', () => {
    it('finds the root layer by its own id', () => {
        const { root } = makeTestTree();
        expect(findChaynsHistoryLayerById(root, 'root')).toBe(root);
    });

    it('finds a direct child by id', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('child');
        expect(findChaynsHistoryLayerById(root, 'child')).toBe(child);
    });

    it('finds a grandchild by id', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('child');
        const grandchild = child.createChildLayer('grandchild');
        expect(findChaynsHistoryLayerById(root, 'grandchild')).toBe(grandchild);
    });

    it('returns undefined for a non-existent id', () => {
        const { root } = makeTestTree();
        root.createChildLayer('child');
        expect(findChaynsHistoryLayerById(root, 'nonexistent')).toBeUndefined();
    });

    it('searches across multiple children', () => {
        const { root } = makeTestTree();
        root.createChildLayer('alpha');
        const beta = root.createChildLayer('beta');
        root.createChildLayer('gamma');

        expect(findChaynsHistoryLayerById(root, 'beta')).toBe(beta);
    });

    it('performs depth-first search', () => {
        const { root } = makeTestTree();
        const a = root.createChildLayer('a');
        const target = a.createChildLayer('deep-target');
        root.createChildLayer('b');

        expect(findChaynsHistoryLayerById(root, 'deep-target')).toBe(target);
    });
});

describe('isInChaynsHistoryActiveChain', () => {
    it('returns true for the root layer (no parent)', () => {
        const { root } = makeTestTree();
        expect(isInChaynsHistoryActiveChain(root)).toBe(true);
    });

    it('returns true when child is the active child of its parent', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('child');
        root._setActiveChildSilent('child');
        expect(isInChaynsHistoryActiveChain(child)).toBe(true);
    });

    it('returns false when child is not the active child', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('child');
        root.createChildLayer('other');
        root._setActiveChildSilent('other');
        expect(isInChaynsHistoryActiveChain(child)).toBe(false);
    });

    it('returns false when no active child is set on parent', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('child');
        // activeChildId remains null
        expect(isInChaynsHistoryActiveChain(child)).toBe(false);
    });

    it('returns false for grandchild when parent is not in active chain', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('child');
        const grandchild = child.createChildLayer('grandchild');
        // root's active child is not 'child'
        root._setActiveChildSilent('other');
        child._setActiveChildSilent('grandchild');
        expect(isInChaynsHistoryActiveChain(grandchild)).toBe(false);
    });

    it('returns true for grandchild when entire chain is active', () => {
        const { root } = makeTestTree();
        const child = root.createChildLayer('child');
        const grandchild = child.createChildLayer('grandchild');
        root._setActiveChildSilent('child');
        child._setActiveChildSilent('grandchild');
        expect(isInChaynsHistoryActiveChain(grandchild)).toBe(true);
    });
});
