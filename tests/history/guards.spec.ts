import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('hasWindow (guards/ssr)', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('returns true in jsdom environment (window is present)', async () => {
        const { hasWindowHistory } = await import('../../src/utils/history/window');
        expect(hasWindowHistory()).toBe(true);
    });

    it('returns false when window.history is absent', async () => {
        const original = (globalThis as any).window;
        Object.defineProperty(globalThis, 'window', {
            value: undefined,
            writable: true,
            configurable: true,
        });

        const { hasWindowHistory } = await import('../../src/utils/history/window');
        expect(hasWindowHistory()).toBe(false);

        Object.defineProperty(globalThis, 'window', {
            value: original,
            writable: true,
            configurable: true,
        });
    });
});
