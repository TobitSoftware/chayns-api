import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HistoryFunctions, RootState } from '../../src/types/history';

/**
 * Mocking history.ts breaks the circular import chain:
 *   ChaynsHistoryHandler → history.ts → rootHistory.ts (singleton side effect)
 *
 * The mock provides the real beforeUnloadCallback implementation so that
 * tests of window.beforeunload listener registration use the actual function
 * reference (needed for removeEventListener matching).
 */
vi.mock('../../src/util/history/history', () => ({
    updateNativeHandling: vi.fn(),
    beforeUnloadCallback: (event: BeforeUnloadEvent) => {
        event.stopPropagation();
        (event as any).returnValue = true;
    },
}));

import { ChaynsHistoryHandler } from '../../src/handler/ChaynsHistoryHandler';
import { beforeUnloadCallback } from '../../src/util/history/history';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createMockFns = (): HistoryFunctions<RootState> => ({
    pushState: vi.fn().mockResolvedValue(true),
    replaceState: vi.fn().mockResolvedValue(true),
    getLocation: vi.fn().mockReturnValue('/'),
    getState: vi.fn().mockReturnValue({ index: 0, safeRouteIndex: -1 } as RootState),
    forward: vi.fn().mockResolvedValue(true),
    back: vi.fn().mockResolvedValue(true),
    go: vi.fn().mockResolvedValue(true),
    block: vi.fn().mockReturnValue(vi.fn()),
    addPopStateListener: vi.fn().mockReturnValue(vi.fn()),
});

const initialState: RootState = { index: 0, safeRouteIndex: -1 };

// ---------------------------------------------------------------------------
// ChaynsHistoryHandler – basic delegation
// ---------------------------------------------------------------------------
describe('ChaynsHistoryHandler', () => {
    let mockFns: ReturnType<typeof createMockFns>;
    let handler: ChaynsHistoryHandler<RootState>;

    beforeEach(() => {
        mockFns = createMockFns();
        handler = new ChaynsHistoryHandler(initialState, mockFns);
        // Clear the replaceState call made inside the constructor.
        vi.mocked(mockFns.replaceState).mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('pushState', () => {
        it('delegates to historyFunctions.pushState', async () => {
            await handler.pushState('/page', { index: 1, safeRouteIndex: -1 });

            expect(mockFns.pushState).toHaveBeenCalledWith('/page', expect.objectContaining({ index: 1 }));
        });

        it('returns true', async () => {
            expect(await handler.pushState('/page', { index: 1, safeRouteIndex: -1 })).toBe(true);
        });
    });

    describe('replaceState', () => {
        it('delegates to historyFunctions.replaceState', async () => {
            await handler.replaceState('/page', { index: 0, safeRouteIndex: -1 });

            expect(mockFns.replaceState).toHaveBeenCalledWith('/page', expect.objectContaining({ index: 0 }));
        });
    });

    describe('forward', () => {
        it('delegates to historyFunctions.forward', async () => {
            await handler.forward();

            expect(mockFns.forward).toHaveBeenCalledOnce();
        });
    });

    describe('back', () => {
        it('delegates to historyFunctions.back', async () => {
            await handler.back();

            expect(mockFns.back).toHaveBeenCalledOnce();
        });
    });

    describe('go', () => {
        it('delegates to historyFunctions.go with the given delta', async () => {
            await handler.go(-3);

            expect(mockFns.go).toHaveBeenCalledWith(-3);
        });
    });

    describe('getLocation', () => {
        it('delegates to historyFunctions.getLocation', () => {
            handler.getLocation();

            expect(mockFns.getLocation).toHaveBeenCalledOnce();
        });
    });

    describe('getState', () => {
        it('delegates to historyFunctions.getState', () => {
            handler.getState();

            expect(mockFns.getState).toHaveBeenCalledOnce();
        });
    });

    describe('block', () => {
        it('delegates to historyFunctions.block', () => {
            const callback = vi.fn();

            handler.block(callback);

            expect(mockFns.block).toHaveBeenCalledWith(callback);
        });

        it('returns a cleanup function', () => {
            const cleanup = handler.block(vi.fn());

            expect(cleanup).toBeTypeOf('function');
        });
    });

    // ---------------------------------------------------------------------------
    // Navigation blocking
    // ---------------------------------------------------------------------------
    describe('blocking', () => {
        it('allows pushState when no block is registered', async () => {
            const result = await handler.pushState('/page', { index: 1, safeRouteIndex: -1 });

            expect(result).toBe(true);
            expect(mockFns.pushState).toHaveBeenCalledOnce();
        });

        it('prevents pushState when a block callback returns false (blocked)', async () => {
            // Activate a child so blocks are checked against a real activeId.
            await handler.pushState('/page', { index: 1, safeRouteIndex: -1, activeId: 'nav' });
            vi.mocked(mockFns.pushState).mockClear();

            const child = handler.createChild('nav', { safeRouteIndex: -1 });
            child.block(() => false); // returns false → block

            const result = await child.pushState('/child', { safeRouteIndex: -1 });

            expect(result).toBe(false);
            expect(mockFns.pushState).not.toHaveBeenCalled();
        });

        it('allows pushState when a block callback returns undefined (unblocked)', async () => {
            await handler.pushState('/page', { index: 1, safeRouteIndex: -1, activeId: 'nav' });
            vi.mocked(mockFns.pushState).mockClear();

            const child = handler.createChild('nav', { safeRouteIndex: -1 });
            child.block(() => undefined); // no return → not blocked

            const result = await child.pushState('/child', { safeRouteIndex: -1 });

            expect(result).toBe(true);
        });

        it('removes a block when its cleanup function is called', async () => {
            await handler.pushState('/page', { index: 1, safeRouteIndex: -1, activeId: 'nav' });
            vi.mocked(mockFns.pushState).mockClear();

            const child = handler.createChild('nav', { safeRouteIndex: -1 });
            const removeBlock = child.block(() => false);

            removeBlock(); // remove the block

            const result = await child.pushState('/child', { safeRouteIndex: -1 });

            expect(result).toBe(true);
        });
    });

    // ---------------------------------------------------------------------------
    // createChild
    // ---------------------------------------------------------------------------
    describe('createChild', () => {
        it('returns a ChaynsHistoryHandler instance', () => {
            const child = handler.createChild('nav', { safeRouteIndex: -1 });

            expect(child).toBeInstanceOf(ChaynsHistoryHandler);
        });

        it('child.pushState returns false when _activeId does not match the child id', async () => {
            const child = handler.createChild('nav', { safeRouteIndex: -1 });
            // Parent's _activeId is null at this point (never set via state)

            const result = await child.pushState('/page', { safeRouteIndex: -1 });

            expect(result).toBe(false);
            expect(mockFns.pushState).not.toHaveBeenCalled();
        });

        it('child.pushState delegates to parent when _activeId matches the child id', async () => {
            const child = handler.createChild('nav', { safeRouteIndex: -1 });
            // Activate the child by pushing a state with activeId = 'nav'
            await handler.pushState('/page', { index: 1, safeRouteIndex: -1, activeId: 'nav' });
            vi.mocked(mockFns.pushState).mockClear();

            const result = await child.pushState('/child-page', { safeRouteIndex: -1 });

            expect(result).toBe(true);
            expect(mockFns.pushState).toHaveBeenCalledOnce();
        });

        it('child.getLocation throws when _activeId does not match the child id', () => {
            const child = handler.createChild('nav', { safeRouteIndex: -1 });

            expect(() => child.getLocation()).toThrow('History is not active');
        });

        it('child.getState throws when _activeId does not match the child id', () => {
            const child = handler.createChild('nav', { safeRouteIndex: -1 });

            expect(() => child.getState()).toThrow('History is not active');
        });

        describe('child addPopStateListener', () => {
            it('registers with the parent addPopStateListener on first child subscriber', () => {
                const child = handler.createChild('nav', { safeRouteIndex: -1 });

                child.addPopStateListener(vi.fn());

                expect(mockFns.addPopStateListener).toHaveBeenCalledOnce();
            });

            it('does not re-register with the parent on additional child subscribers', () => {
                const child = handler.createChild('nav', { safeRouteIndex: -1 });
                child.addPopStateListener(vi.fn());
                vi.mocked(mockFns.addPopStateListener).mockClear();

                child.addPopStateListener(vi.fn());

                expect(mockFns.addPopStateListener).not.toHaveBeenCalled();
            });

            it('deregisters from the parent when the last child subscriber unsubscribes', () => {
                const child = handler.createChild('nav', { safeRouteIndex: -1 });
                const parentCleanup = vi.fn();
                vi.mocked(mockFns.addPopStateListener).mockReturnValue(parentCleanup);

                const cleanup = child.addPopStateListener(vi.fn());
                cleanup();

                expect(parentCleanup).toHaveBeenCalledOnce();
            });

            it('propagates childState to the child popstate callback', async () => {
                const child = handler.createChild('nav', { safeRouteIndex: -1 });
                const childCallback = vi.fn();

                child.addPopStateListener(childCallback);

                // Retrieve the callback registered with the parent
                const parentCallback = vi.mocked(mockFns.addPopStateListener).mock.calls[0]?.[0];
                expect(parentCallback).toBeDefined();

                const parentState: RootState = {
                    index: 1,
                    safeRouteIndex: -1,
                    childState: { activeId: 'nav' },
                };
                await parentCallback!(parentState, undefined);

                expect(childCallback).toHaveBeenCalledWith(parentState.childState, undefined);
            });
        });
    });

    // ---------------------------------------------------------------------------
    // beforeunload listener management via child.block()
    // ---------------------------------------------------------------------------
    describe('beforeunload listener', () => {
        it('attaches beforeunload when a child block is registered and the child is active', async () => {
            const child = handler.createChild('nav', { safeRouteIndex: -1 });
            // Activate the child
            await handler.pushState('/page', { index: 1, safeRouteIndex: -1, activeId: 'nav' });

            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            child.block(vi.fn());

            expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', beforeUnloadCallback);
        });

        it('removes beforeunload when the child block cleanup is called', async () => {
            const child = handler.createChild('nav', { safeRouteIndex: -1 });
            await handler.pushState('/page', { index: 1, safeRouteIndex: -1, activeId: 'nav' });

            const cleanup = child.block(vi.fn());
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

            cleanup();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', beforeUnloadCallback);
        });

        it('does not remove beforeunload while another block for the same child is still registered', async () => {
            const child = handler.createChild('nav', { safeRouteIndex: -1 });
            await handler.pushState('/page', { index: 1, safeRouteIndex: -1, activeId: 'nav' });

            const cleanup1 = child.block(vi.fn());
            child.block(vi.fn()); // second block keeps it alive

            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
            cleanup1();

            expect(removeEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', beforeUnloadCallback);
        });
    });
});
