import { describe, it, expect } from 'vitest';
import { shallowEqualArr, shallowEqualObj } from '../../src/utils/equality';

describe('shallowEqualArr', () => {
    it('returns true for two empty arrays', () => {
        expect(shallowEqualArr([], [])).toBe(true);
    });

    it('returns true for arrays with identical primitive values', () => {
        expect(shallowEqualArr([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('returns true for single-element arrays with same value', () => {
        expect(shallowEqualArr(['foo'], ['foo'])).toBe(true);
    });

    it('returns false when lengths differ', () => {
        expect(shallowEqualArr([1, 2], [1, 2, 3])).toBe(false);
        expect(shallowEqualArr([1, 2, 3], [1, 2])).toBe(false);
    });

    it('returns false when a value differs', () => {
        expect(shallowEqualArr([1, 2, 3], [1, 2, 4])).toBe(false);
        expect(shallowEqualArr([1, 2, 3], [1, 9, 3])).toBe(false);
    });

    it('uses strict reference equality for objects', () => {
        const obj = {};
        expect(shallowEqualArr([obj], [obj])).toBe(true);
        expect(shallowEqualArr([{}], [{}])).toBe(false);
    });

    it('returns false when same elements are in different order', () => {
        expect(shallowEqualArr([1, 2], [2, 1])).toBe(false);
    });
});

describe('shallowEqualObj', () => {
    it('returns true for two empty objects', () => {
        expect(shallowEqualObj({}, {})).toBe(true);
    });

    it('returns true when all key-value pairs match', () => {
        expect(shallowEqualObj({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('returns true for single matching key', () => {
        expect(shallowEqualObj({ x: 'hello' }, { x: 'hello' })).toBe(true);
    });

    it('returns false when key counts differ', () => {
        expect(shallowEqualObj({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(shallowEqualObj({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('returns false when a value differs', () => {
        expect(shallowEqualObj({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false when keys are different even if same count', () => {
        expect(shallowEqualObj({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('uses strict reference equality for object values', () => {
        const obj = {};
        expect(shallowEqualObj({ x: obj }, { x: obj })).toBe(true);
        expect(shallowEqualObj({ x: {} }, { x: {} })).toBe(false);
    });
});
