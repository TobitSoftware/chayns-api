import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseHistoryState, RootState } from '../../src/types/history';

/**
 * rootHistory is a module-level singleton whose module-scoped state
 * (`popStateCallbacks`, `wasPreviouslyBlocked`, `currentState`) persists
 * for the lifetime of the imported module.
 *
 * We use vi.resetModules() + vi.doMock() in beforeEach so each test gets a
 * completely fresh singleton and a fresh set of module-scoped variables.
 *
 * The ChaynsHistoryHandler constructor calls:
 *   void this.replaceState(window.location.href, initialState)
 *
 * In the root handler, this calls getNewUrl(window.location.href), which
 * throws because window.location.href is always an absolute URL.
 * We prevent the throw by spying on ChaynsHistoryHandler.prototype.replaceState
 * BEFORE importing rootHistory, then restoring immediately after construction
 * so that real calls in tests use the actual implementation.
 */

let rootHistory: typeof import('../../src/util/history/rootHistory')['rootHistory'];
let updateNativeHandlingMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
    vi.resetModules();

    const mockUpdateNativeHandling = vi.fn();

    vi.doMock('../../src/util/history/history', () => ({
        updateNativeHandling: mockUpdateNativeHandling,
        beforeUnloadCallback: vi.fn(),
    }));

    vi.doMock('../../src/calls', () => ({
        getSite: vi.fn(() => ({ url: 'http://localhost/' })),
        getDevice: vi.fn(() => ({})),
        invokeCall: vi.fn(),
    }));

    // Import ChaynsHistoryHandler first (history.ts is mocked → no circular chain)
    // and spy on prototype.replaceState to swallow the constructor's call to
    // getNewUrl(window.location.href), which would otherwise throw on absolute URLs.
    const { ChaynsHistoryHandler } = await import('../../src/handler/ChaynsHistoryHandler') as typeof import('../../src/handler/ChaynsHistoryHandler');
    const protoSpy = vi.spyOn(ChaynsHistoryHandler.prototype, 'replaceState').mockResolvedValue(true);

    // Install window.history spies BEFORE importing rootHistory.
    vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    vi.spyOn(window.history, 'back').mockImplementation(() => {});
    vi.spyOn(window.history, 'forward').mockImplementation(() => {});
    vi.spyOn(window.history, 'go').mockImplementation(() => {});

    const mod = await import('../../src/util/history/rootHistory');
    rootHistory = mod.rootHistory;

    // Restore the prototype spy so subsequent test calls use the real method.
    protoSpy.mockRestore();

    updateNativeHandlingMock = mockUpdateNativeHandling;

    // Clear calls made during module initialisation.
    vi.mocked(window.history.replaceState).mockClear();
    updateNativeHandlingMock.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// pushState and replaceState — exercised via a child handler
//
// Direct calls to rootHistory.pushState / rootHistory.replaceState should not
// happen in application code; the root handler exists only to manage the
// underlying window.history and to delegate to child handlers.
//
// Helper: activate the given child id on rootHistory without calling
// rootHistory.pushState directly.
// ---------------------------------------------------------------------------
const CHILD_ID = 'test-child';

const activateChild = (handler: typeof rootHistory, id: string | number) => {
    (handler as any)._activeId = id;
};

describe('via child handler: pushState', () => {
    let child: ReturnType<typeof rootHistory.createChild<BaseHistoryState>>;

    beforeEach(() => {
        child = rootHistory.createChild(CHILD_ID, { safeRouteIndex: -1 });
        activateChild(rootHistory, CHILD_ID);
        // Clear any replaceState call emitted by the child's constructor.
        vi.mocked(window.history.replaceState).mockClear();
        updateNativeHandlingMock.mockClear();
    });

    it('calls window.history.pushState with the correct state and URL', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 0, safeRouteIndex: -1 });

        await child.pushState('/page', { safeRouteIndex: -1 });

        // URL is always built from window.location.href (getNewUrl ignores the
        // path argument for construction; the location param is only used for
        // the absolute-URL guard and the query-param warning).
        expect(window.history.pushState).toHaveBeenCalledWith(
            { index: 1, safeRouteIndex: -1, childState: { safeRouteIndex: -1, activeId: null }, activeId: CHILD_ID },
            '',
            'http://localhost/',
        );
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 2, safeRouteIndex: -1 });

        await child.pushState('/page', { safeRouteIndex: -1 });

        expect(window.history.pushState).toHaveBeenCalledWith(
            { index: 3, safeRouteIndex: -1, childState: { safeRouteIndex: -1, activeId: null }, activeId: CHILD_ID },
            '',
            'http://localhost/',
        );
    });

    it('starts at index 0 when history state is empty', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue(null);

        await child.pushState('/page', { safeRouteIndex: -1 });

        // getState() returns {} when history.state is null; current.index is
        // undefined so the ternary falls to the 0 branch (not 0+1).
        // _syncState also fills in safeRouteIndex from the handler's own field.
        expect(window.history.pushState).toHaveBeenCalledWith(
            { index: 0, safeRouteIndex: -1, childState: { safeRouteIndex: -1, activeId: null }, activeId: CHILD_ID },
            '',
            'http://localhost/',
        );
    });

    it('embeds the child state inside the root history state', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 0, safeRouteIndex: -1 });
        const childState: BaseHistoryState = { safeRouteIndex: 2 };

        await child.pushState('/page', childState);

        expect(window.history.pushState).toHaveBeenCalledWith(
            { index: 1, safeRouteIndex: -1, childState: { safeRouteIndex: 2, activeId: null }, activeId: CHILD_ID },
            '',
            'http://localhost/',
        );
    });

    it('returns false when the child is not the active handler', async () => {
        activateChild(rootHistory, 'other-child');

        const result = await child.pushState('/page', { safeRouteIndex: -1 });

        expect(result).toBe(false);
        expect(window.history.pushState).not.toHaveBeenCalled();
    });

    it('rejects when an absolute URL is passed', async () => {
        // child.pushState is async, so the synchronous throw from getNewUrl
        // is caught and re-raised as a rejected Promise.
        await expect(child.pushState('https://example.com', { safeRouteIndex: -1 })).rejects.toThrow(
            'Absolute URLs are not supported',
        );
    });

    it('calls updateNativeHandling after pushing', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 0, safeRouteIndex: -1 });

        await child.pushState('/page', { safeRouteIndex: -1 });

        expect(updateNativeHandlingMock).toHaveBeenCalled();
    });

    it('returns true on success', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 0, safeRouteIndex: -1 });

        const result = await child.pushState('/page', { safeRouteIndex: -1 });

        expect(result).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// replaceState
// ---------------------------------------------------------------------------
describe('via child handler: replaceState', () => {
    let child: ReturnType<typeof rootHistory.createChild<BaseHistoryState>>;

    beforeEach(() => {
        child = rootHistory.createChild(CHILD_ID, { safeRouteIndex: -1 });
        activateChild(rootHistory, CHILD_ID);
        vi.mocked(window.history.replaceState).mockClear();
        updateNativeHandlingMock.mockClear();
    });

    it('calls window.history.replaceState with the correct state and URL', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 3, safeRouteIndex: -1 });

        await child.replaceState('/page', { safeRouteIndex: -1 });

        // replaceState preserves the current index (no increment).
        expect(window.history.replaceState).toHaveBeenCalledWith(
            { index: 3, safeRouteIndex: -1, childState: { safeRouteIndex: -1, activeId: null }, activeId: CHILD_ID },
            '',
            'http://localhost/',
        );
    });

    it('returns false when the child is not the active handler', async () => {
        activateChild(rootHistory, 'other-child');

        const result = await child.replaceState('/page', { safeRouteIndex: -1 });

        expect(result).toBe(false);
        expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it('returns true on success', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 0, safeRouteIndex: -1 });

        expect(await child.replaceState('/page', { safeRouteIndex: -1 })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// getState — via child handler
// ---------------------------------------------------------------------------
describe('via child handler: getState', () => {
    let child: ReturnType<typeof rootHistory.createChild<BaseHistoryState>>;

    beforeEach(() => {
        child = rootHistory.createChild(CHILD_ID, { safeRouteIndex: -1 });
        activateChild(rootHistory, CHILD_ID);
    });

    it('returns the childState stored inside the parent history state', () => {
        const childState: BaseHistoryState = { safeRouteIndex: 2 };
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({
            index: 1, safeRouteIndex: -1, activeId: CHILD_ID, childState,
        });

        expect(child.getState()).toEqual(childState);
    });

    it('returns undefined when the parent state has no childState field', () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({
            index: 1, safeRouteIndex: -1, activeId: CHILD_ID,
        });

        expect(child.getState()).toBeUndefined();
    });

    it('throws when the child is not the active handler', () => {
        activateChild(rootHistory, 'other-child');

        expect(() => child.getState()).toThrow('History is not active');
    });
});

// ---------------------------------------------------------------------------
// getLocation — via child handler
// ---------------------------------------------------------------------------
describe('via child handler: getLocation', () => {
    let child: ReturnType<typeof rootHistory.createChild<BaseHistoryState>>;

    beforeEach(() => {
        child = rootHistory.createChild(CHILD_ID, { safeRouteIndex: -1 });
        activateChild(rootHistory, CHILD_ID);
    });

    it('returns the full location when safeRouteIndex is -1', () => {
        vi.spyOn(rootHistory, 'getLocation').mockReturnValue('/app/section');

        expect(child.getLocation()).toBe('/app/section');
    });

    it('returns the path sliced from safeRouteIndex when set', () => {
        vi.spyOn(rootHistory, 'getLocation').mockReturnValue('/app/section/page');
        // parent._safeRouteIndex = 2:
        // '/app/section/page'.split('/') → ['', 'app', 'section', 'page']
        // .slice(2) → ['section', 'page']
        // .join('/') → 'section/page'
        (rootHistory as any)._safeRouteIndex = 2;

        expect(child.getLocation()).toBe('section/page');
    });

    it('throws when the child is not the active handler', () => {
        activateChild(rootHistory, 'other-child');

        expect(() => child.getLocation()).toThrow('History is not active');
    });
});


describe('rootHistory.back', () => {
    it('calls window.history.back when index > 0', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 1, safeRouteIndex: -1 });

        await rootHistory.back();

        expect(window.history.back).toHaveBeenCalledOnce();
    });

    it('does not call window.history.back or any callback when index === 0 (ChaynsHistoryHandler.back does not forward callbacks)', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 0, safeRouteIndex: -1 });
        const callback = vi.fn();

        // ChaynsHistoryHandler.back() has no callback parameter — it always
        // calls this._historyFunctions.back() with no arguments, so the
        // underlying back function receives callback=undefined.
        await rootHistory.back(callback);

        expect(window.history.back).not.toHaveBeenCalled();
        // callback is silently dropped by the ChaynsHistoryHandler wrapper
        expect(callback).not.toHaveBeenCalled();
    });

    it('does nothing when index === 0 and no callback is provided', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 0, safeRouteIndex: -1 });

        await rootHistory.back();

        expect(window.history.back).not.toHaveBeenCalled();
    });

    it('returns true', async () => {
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ index: 1, safeRouteIndex: -1 });

        expect(await rootHistory.back()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// forward
// ---------------------------------------------------------------------------
describe('rootHistory.forward', () => {
    it('delegates to window.history.forward', async () => {
        await rootHistory.forward();

        expect(window.history.forward).toHaveBeenCalledOnce();
    });

    it('returns true', async () => {
        expect(await rootHistory.forward()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// go
// ---------------------------------------------------------------------------
describe('rootHistory.go', () => {
    it('delegates to window.history.go with the given delta', async () => {
        await rootHistory.go(-2);

        expect(window.history.go).toHaveBeenCalledWith(-2);
    });

    it('returns true', async () => {
        expect(await rootHistory.go(1)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// block
// ---------------------------------------------------------------------------
describe('rootHistory.block', () => {
    it('calls updateNativeHandling(true) when blocking', () => {
        rootHistory.block(vi.fn());

        expect(updateNativeHandlingMock).toHaveBeenCalledWith(true);
    });

    it('returns a cleanup function', () => {
        const cleanup = rootHistory.block(vi.fn());

        expect(cleanup).toBeTypeOf('function');
    });

    it('calls updateNativeHandling() (no args) on cleanup', () => {
        const cleanup = rootHistory.block(vi.fn());
        updateNativeHandlingMock.mockClear();

        cleanup();

        expect(updateNativeHandlingMock).toHaveBeenCalledWith();
    });
});

// ---------------------------------------------------------------------------
// addPopStateListener
// ---------------------------------------------------------------------------
describe('rootHistory.addPopStateListener', () => {
    it('attaches a popstate event listener on the first subscriber', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

        const cleanup = rootHistory.addPopStateListener(vi.fn());

        expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
        cleanup();
    });

    it('does not attach a second popstate listener for additional subscribers', () => {
        const cleanup1 = rootHistory.addPopStateListener(vi.fn());

        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        const cleanup2 = rootHistory.addPopStateListener(vi.fn());

        expect(addEventListenerSpy).not.toHaveBeenCalledWith('popstate', expect.any(Function));
        cleanup1();
        cleanup2();
    });

    it('removes the popstate event listener when the last subscriber unsubscribes', () => {
        const cleanup = rootHistory.addPopStateListener(vi.fn());
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        cleanup();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    });

    it('does not remove the listener while there are still subscribers', () => {
        const cleanup1 = rootHistory.addPopStateListener(vi.fn());
        const cleanup2 = rootHistory.addPopStateListener(vi.fn());
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        cleanup1();

        expect(removeEventListenerSpy).not.toHaveBeenCalledWith('popstate', expect.any(Function));
        cleanup2();
    });
});

// ---------------------------------------------------------------------------
// popstate event handling
// ---------------------------------------------------------------------------
describe('popstate event handling', () => {
    const dispatchPopState = (state: RootState) =>
        window.dispatchEvent(new PopStateEvent('popstate', { state }));

    it('invokes registered callbacks with the new state and the previous state', async () => {
        const callback = vi.fn().mockResolvedValue(false);
        const cleanup = rootHistory.addPopStateListener(callback);

        const state: RootState = { index: 1, safeRouteIndex: -1 };
        dispatchPopState(state);
        await vi.waitFor(() => expect(callback).toHaveBeenCalled());

        // previousState is undefined on first popstate (currentState not yet set)
        expect(callback).toHaveBeenCalledWith(state, undefined);
        cleanup();
    });

    it('passes the previous state on subsequent popstates', async () => {
        const callback = vi.fn().mockResolvedValue(false);
        const cleanup = rootHistory.addPopStateListener(callback);

        const first: RootState = { index: 1, safeRouteIndex: -1 };
        dispatchPopState(first);
        await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
        // The callback is called synchronously, but `currentState = state` is
        // set after the awaited Promise.all resolves.  A setTimeout(0) flush
        // ensures the async continuation of popStateCallback has completed.
        await new Promise((resolve) => setTimeout(resolve, 0));

        const second: RootState = { index: 2, safeRouteIndex: -1 };
        dispatchPopState(second);
        await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(2));

        expect(callback).toHaveBeenNthCalledWith(2, second, first);
        cleanup();
    });

    it('calls window.history.forward when a back-navigation is blocked (currentState.index > newState.index)', async () => {
        // Seed currentState with index 2 using a non-blocking callback.
        const seeder = vi.fn().mockResolvedValue(false);
        const cleanupSeed = rootHistory.addPopStateListener(seeder);
        dispatchPopState({ index: 2, safeRouteIndex: -1 });
        await vi.waitFor(() => expect(seeder).toHaveBeenCalled());
        cleanupSeed();

        const blockingCallback = vi.fn().mockResolvedValue(true);
        const cleanup = rootHistory.addPopStateListener(blockingCallback);

        vi.mocked(window.history.forward).mockClear();
        dispatchPopState({ index: 1, safeRouteIndex: -1 }); // going back
        await vi.waitFor(() => expect(window.history.forward).toHaveBeenCalled());

        expect(window.history.back).not.toHaveBeenCalled();
        cleanup();
    });

    it('calls window.history.back when a forward-navigation is blocked (currentState.index < newState.index)', async () => {
        // Seed currentState with index 0.
        const seeder = vi.fn().mockResolvedValue(false);
        const cleanupSeed = rootHistory.addPopStateListener(seeder);
        dispatchPopState({ index: 0, safeRouteIndex: -1 });
        await vi.waitFor(() => expect(seeder).toHaveBeenCalled());
        cleanupSeed();

        const blockingCallback = vi.fn().mockResolvedValue(true);
        const cleanup = rootHistory.addPopStateListener(blockingCallback);

        vi.mocked(window.history.back).mockClear();
        dispatchPopState({ index: 1, safeRouteIndex: -1 }); // going forward
        await vi.waitFor(() => expect(window.history.back).toHaveBeenCalled());

        expect(window.history.forward).not.toHaveBeenCalled();
        cleanup();
    });

    it('skips processing the popstate event immediately after a block (wasPreviouslyBlocked)', async () => {
        const blockingCallback = vi.fn().mockResolvedValue(true);
        const cleanup = rootHistory.addPopStateListener(blockingCallback);

        // First event: blocked → wasPreviouslyBlocked = true (set after await)
        dispatchPopState({ index: 1, safeRouteIndex: -1 });
        await vi.waitFor(() => expect(blockingCallback).toHaveBeenCalledTimes(1));
        // Flush the event loop so wasPreviouslyBlocked = true is committed before
        // the next dispatch.
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Second event: skipped because wasPreviouslyBlocked = true
        dispatchPopState({ index: 0, safeRouteIndex: -1 });
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(blockingCallback).toHaveBeenCalledTimes(1);
        cleanup();
    });
});
