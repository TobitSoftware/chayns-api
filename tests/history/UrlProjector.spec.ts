import { describe, it, expect } from 'vitest';
import { projectToUrl, parseFromUrl } from '../../src/utils/history/url';
import { makeTestTree } from './helpers';

// ---------------------------------------------------------------------------
// projectToUrl
// ---------------------------------------------------------------------------

describe('projectToUrl', () => {
    it('returns "/" when root has no segments', () => {
        const { root } = makeTestTree();
        expect(projectToUrl(root)).toBe('/');
    });

    it('includes root segments in the URL path', () => {
        const { root } = makeTestTree();
        root._setOwnSegmentsSilent(['products', 'shoes']);
        expect(projectToUrl(root)).toBe('/products/shoes');
    });

    it('concatenates segments from root and active child', () => {
        const { root } = makeTestTree();
        root._setOwnSegmentsSilent(['products']);
        const child = root.createChildLayer('catalog');
        child._setOwnSegmentsSilent(['shoes']);
        root._setActiveChildSilent('catalog');

        expect(projectToUrl(root)).toBe('/products/shoes');
    });

    it('concatenates segments across a three-layer active chain', () => {
        const { root } = makeTestTree();
        root._setOwnSegmentsSilent(['a']);
        const b = root.createChildLayer('b');
        b._setOwnSegmentsSilent(['b']);
        const c = b.createChildLayer('c');
        c._setOwnSegmentsSilent(['c']);
        root._setActiveChildSilent('b');
        b._setActiveChildSilent('c');

        expect(projectToUrl(root)).toBe('/a/b/c');
    });

    it('appends query params as a search string', () => {
        const { root } = makeTestTree();
        root._setOwnSegmentsSilent(['search']);
        root._setOwnParamsSilent({ q: 'boots', page: '2' });

        const url = projectToUrl(root);
        expect(url).toMatch(/^\/search\?/);
        const parsed = new URL('http://x' + url);
        expect(parsed.searchParams.get('q')).toBe('boots');
        expect(parsed.searchParams.get('page')).toBe('2');
    });

    it('merges params from all layers in the active chain', () => {
        const { root } = makeTestTree();
        root._setOwnParamsSilent({ a: '1' });
        const child = root.createChildLayer('child');
        child._setOwnParamsSilent({ b: '2' });
        root._setActiveChildSilent('child');

        const url = projectToUrl(root);
        const parsed = new URL('http://x' + url);
        expect(parsed.searchParams.get('a')).toBe('1');
        expect(parsed.searchParams.get('b')).toBe('2');
    });

    it('deeper layer params override shallower layer params for the same key', () => {
        const { root } = makeTestTree();
        root._setOwnParamsSilent({ key: 'parent' });
        const child = root.createChildLayer('child');
        child._setOwnParamsSilent({ key: 'child' });
        root._setActiveChildSilent('child');

        const url = projectToUrl(root);
        const parsed = new URL('http://x' + url);
        expect(parsed.searchParams.get('key')).toBe('child');
    });

    it('appends hash from the deepest layer that set it', () => {
        const { root } = makeTestTree();
        root._setOwnHashSilent('section1');
        const child = root.createChildLayer('child');
        child._setOwnHashSilent('section2');
        root._setActiveChildSilent('child');

        expect(projectToUrl(root)).toContain('#section2');
    });

    it('uses root hash when child has no hash', () => {
        const { root } = makeTestTree();
        root._setOwnHashSilent('anchor');
        const child = root.createChildLayer('child');
        // child has no hash (undefined)
        root._setActiveChildSilent('child');

        expect(projectToUrl(root)).toContain('#anchor');
    });

    it('does not append a hash when none is set', () => {
        const { root } = makeTestTree();
        expect(projectToUrl(root)).not.toContain('#');
    });

    it('does not append a hash when it is an empty string', () => {
        const { root } = makeTestTree();
        root._setOwnHashSilent('');
        // hash is explicitly cleared (empty string) — no fragment appended
        expect(projectToUrl(root)).not.toContain('#');
    });

    it('returns only "/" when root has empty segments array', () => {
        const { root } = makeTestTree(0, []);
        expect(projectToUrl(root)).toBe('/');
    });
});

// ---------------------------------------------------------------------------
// parseFromUrl
// ---------------------------------------------------------------------------

describe('parseFromUrl', () => {
    it('assigns segments to root based on its segmentCount', () => {
        const { root } = makeTestTree();
        root.setSegmentCount(1);

        const { perLayerSegments, pendingSegments } = parseFromUrl('/products', root);
        expect(perLayerSegments.get('root')).toEqual(['products']);
        expect(pendingSegments).toEqual([]);
    });

    it('distributes segments across multiple layers in the active chain', () => {
        const { root } = makeTestTree();
        root.setSegmentCount(1);
        const child = root.createChildLayer('child');
        child.setSegmentCount(1);
        root._setActiveChildSilent('child');

        const { perLayerSegments, pendingSegments } = parseFromUrl('/products/shoes', root);
        expect(perLayerSegments.get('root')).toEqual(['products']);
        expect(perLayerSegments.get('child')).toEqual(['shoes']);
        expect(pendingSegments).toEqual([]);
    });

    it('pads with empty strings when URL has fewer segments than segmentCount', () => {
        const { root } = makeTestTree();
        root.setSegmentCount(2);

        const { perLayerSegments } = parseFromUrl('/products', root);
        expect(perLayerSegments.get('root')).toEqual(['products', '']);
    });

    it('collects excess segments into pendingSegments', () => {
        const { root } = makeTestTree();
        root.setSegmentCount(1);

        const { perLayerSegments, pendingSegments } = parseFromUrl('/products/shoes/extra', root);
        expect(perLayerSegments.get('root')).toEqual(['products']);
        expect(pendingSegments).toEqual(['shoes', 'extra']);
    });

    it('handles URL without a leading slash', () => {
        const { root } = makeTestTree();
        root.setSegmentCount(1);

        const { perLayerSegments } = parseFromUrl('products', root);
        expect(perLayerSegments.get('root')).toEqual(['products']);
    });

    it('handles root "/" URL with segmentCount of 1 by returning empty string segment', () => {
        const { root } = makeTestTree();
        root.setSegmentCount(1);

        const { perLayerSegments } = parseFromUrl('/', root);
        expect(perLayerSegments.get('root')).toEqual(['']);
    });

    it('returns all segments as pending when root has segmentCount 0', () => {
        const { root } = makeTestTree();
        // segmentCount defaults to 0

        const { perLayerSegments, pendingSegments } = parseFromUrl('/a/b/c', root);
        expect(perLayerSegments.get('root')).toEqual([]);
        expect(pendingSegments).toEqual(['a', 'b', 'c']);
    });

    it('only parses layers in the active chain', () => {
        const { root } = makeTestTree();
        root.setSegmentCount(1);
        root.createChildLayer('inactive'); // child exists but is not active
        // root's activeChildId remains null

        const { perLayerSegments, pendingSegments } = parseFromUrl('/seg1/seg2', root);
        // Only root is in the active chain
        expect(perLayerSegments.size).toBe(1);
        expect(pendingSegments).toEqual(['seg2']);
    });

    it('handles empty URL string', () => {
        const { root } = makeTestTree();
        root.setSegmentCount(1);

        const { perLayerSegments } = parseFromUrl('', root);
        expect(perLayerSegments.get('root')).toEqual(['']);
    });
});

describe('createChildLayer', () => {
    it('uses the combined segmentCount of all parent layers for bootstrap segments', () => {
        const previousUrl = window.location.href;

        try {
            window.history.replaceState({}, '', 'http://localhost/a/b/c/d/e/f/g');

            const { root } = makeTestTree();
            root.setSegmentCount(3);

            const child = root.createChildLayer('child');
            child.setSegmentCount(2);

            const grandchild = child.createChildLayer('grandchild');

            expect(grandchild.getRoute()).toEqual(['f', 'g']);
            expect(grandchild.getSegmentCount()).toBe(2);
        } finally {
            window.history.replaceState({}, '', previousUrl);
        }
    });
});

