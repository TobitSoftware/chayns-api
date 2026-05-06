import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Module-level state requires fresh imports per test — use vi.resetModules().

describe('NavigationIndex', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // -------------------------------------------------------------------------
    // getCurrentIdx / incrementIdx
    // -------------------------------------------------------------------------

    describe('getCurrentIdx / incrementIdx', () => {
        it('starts at 0', async () => {
            const { getCurrentIdx } = await import('../../src/utils/history/navigationIndex');
            expect(getCurrentIdx()).toBe(0);
        });

        it('incrementIdx returns the new value', async () => {
            const { incrementIdx } = await import('../../src/utils/history/navigationIndex');
            expect(incrementIdx()).toBe(1);
        });

        it('incrementIdx updates getCurrentIdx', async () => {
            const { incrementIdx, getCurrentIdx } = await import('../../src/utils/history/navigationIndex');
            incrementIdx();
            incrementIdx();
            expect(getCurrentIdx()).toBe(2);
        });

        it('multiple increments are monotonically increasing', async () => {
            const { incrementIdx } = await import('../../src/utils/history/navigationIndex');
            const results = [incrementIdx(), incrementIdx(), incrementIdx()];
            expect(results).toEqual([1, 2, 3]);
        });
    });

    // -------------------------------------------------------------------------
    // consumeSilent
    // -------------------------------------------------------------------------

    describe('consumeSilent', () => {
        it('returns false when no silentGo is pending', async () => {
            const { consumeSilent } = await import('../../src/utils/history/navigationIndex');
            expect(consumeSilent()).toBe(false);
        });

        it('returns true when a silentGo is pending and resolves the promise', async () => {
            vi.spyOn(window.history, 'go').mockImplementation(() => {});

            const { silentGo, consumeSilent } = await import('../../src/utils/history/navigationIndex');
            const promise = silentGo(-1);

            expect(consumeSilent()).toBe(true);
            await promise;

            // Counter is now 0, so next call should be false.
            expect(consumeSilent()).toBe(false);
        });

        it('absorbs each silentGo independently', async () => {
            vi.spyOn(window.history, 'go').mockImplementation(() => {});

            const { silentGo, consumeSilent } = await import('../../src/utils/history/navigationIndex');
            silentGo(-1);
            silentGo(-1);

            expect(consumeSilent()).toBe(true);
            expect(consumeSilent()).toBe(true);
            expect(consumeSilent()).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // silentGo
    // -------------------------------------------------------------------------

    describe('silentGo', () => {
        it('calls window.history.go with the given delta', async () => {
            const goSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});

            const { silentGo, consumeSilent } = await import('../../src/utils/history/navigationIndex');
            const promise = silentGo(-2);
            consumeSilent(); // resolve it so the promise settles

            await promise;
            expect(goSpy).toHaveBeenCalledWith(-2);
        });

        it('resolves via timeout when popstate never fires', async () => {
            vi.useFakeTimers();
            vi.spyOn(window.history, 'go').mockImplementation(() => {});

            const { silentGo, consumeSilent } = await import('../../src/utils/history/navigationIndex');
            const promise = silentGo(-1);

            await vi.runAllTimersAsync();
            await promise; // should have resolved via the 2s safety timeout

            // pendingSilentCount is intentionally NOT decremented on timeout,
            // so the late popstate is still absorbed.
            expect(consumeSilent()).toBe(true);
        });
    });
});
