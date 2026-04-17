import type {IChaynsHistoryHandler, PopStateCallback, RootState} from "../../types/history";
import {ChaynsHistoryHandler} from "../../handler/ChaynsHistoryHandler";
import {updateNativeHandling} from "./history";
import {getSite} from "../../calls";

/**
 * Build the URL that should be written to `window.history`.
 *
 * Only relative `location` values are accepted — the path itself is taken
 * from the current `window.location` (stripping any `fromRedirect` query
 * param).  The `location` argument is used solely to detect absolute URLs
 * and to warn about query parameters; it does not influence the constructed URL.
 */
const getNewUrl = (location: string) => {
    let isAbsolute = true;
    try {
        new URL(location);
    } catch {
        isAbsolute = false;
    }

    if (isAbsolute) {
        throw new Error(`Absolute URLs are not supported. Use relative URLs instead. ${location}`);
    }

    const currentUrl = new URL(window.location.href);
    const base = currentUrl.origin;

    const params = currentUrl.searchParams;
    if (location?.includes('?')) {
        console.warn('Query parameters are not supported and will be removed.');
    }
    const path = currentUrl.pathname.split('/').slice(1).join('/').split('?')[0];

    const url = new URL(path, base);
    ['fromRedirect']?.forEach((param) => params.delete(param));
    url.search = params.toString();
    return url.toString();
};

/**
 * Compute the next history state by merging the provided `state` with the
 * current `window.history.state`.
 *
 * - `pushState`: increments `index` by 1 (or starts at 0 when there is no
 *   existing index).
 * - `replaceState` (`isReplace = true`): preserves the current `index`.
 */
const getNewState = (state: RootState, isReplace = false): RootState => {
    const current = getState();

    return {
        ...current,
        ...state,
        index: isReplace ? (current?.index ?? 0) : (current?.index || current?.index === 0) ? current.index + 1 : 0,
    }
}

/** Registered callbacks that are notified on every popstate event. */
const popStateCallbacks: Set<PopStateCallback<RootState>> = new Set();

/**
 * Set to `true` when a navigation is blocked and the browser was instructed
 * to reverse it (via `history.forward()` / `history.back()`).  The subsequent
 * synthetic popstate triggered by that reversal must be ignored to avoid an
 * infinite block loop.
 */
let wasPreviouslyBlocked = false;
/** The history state at the time of the last processed popstate. */
let currentState: RootState;

/**
 * Handles every native `popstate` event.
 *
 * 1. Skips the event if it was synthetically triggered to reverse a blocked
 *    navigation (`wasPreviouslyBlocked`).
 * 2. Passes the new state to all registered callbacks.  If any callback
 *    returns `true` (block), the navigation is reversed using
 *    `history.forward()` or `history.back()` depending on direction.
 * 3. Otherwise updates `currentState` and calls `updateNativeHandling`.
 */
const popStateCallback = async (event: PopStateEvent) => {
    if (wasPreviouslyBlocked) {
        wasPreviouslyBlocked = false;
        return;
    }

    const state = event.state as RootState;

    if (await Promise.all([...popStateCallbacks].map(callback => callback(state, currentState))).then(results => results.some(result => result))) {
        wasPreviouslyBlocked = true;
        if ((currentState?.index || -1) > (event.state as RootState)?.index) {
            window.history.forward();
        } else {
            window.history.back();
        }
        return;
    }

    updateNativeHandling();
    currentState = state;
}

const getLocation = () => new URL(global.window ? window.location.href : getSite().url).pathname;

const getState = () => (window.history.state || {}) as RootState;

const pushState: IChaynsHistoryHandler<RootState>['pushState'] = (location, state) => {
    const newUrl = getNewUrl(location);
    const newState = getNewState(state);

    window.history.pushState(newState, '', newUrl);
    updateNativeHandling();
    return Promise.resolve(true);
};

const replaceState: IChaynsHistoryHandler<RootState>['replaceState'] = (location, state) => {
    const newUrl = getNewUrl(location);
    const newState = getNewState(state, true);

    window.history.replaceState(newState, '', newUrl);
    return Promise.resolve(true);
};

const forward: IChaynsHistoryHandler<RootState>['forward'] = () => {
    window.history.forward();
    return Promise.resolve(true);
};

const back: IChaynsHistoryHandler<RootState>['back'] = async (callback) => {
    const index = getState().index ?? 0;

    if (index > 0) {
        window.history.back();
    } else if (callback) {
        await callback();
    }

    return true;
};

const go: IChaynsHistoryHandler<RootState>['go'] = (delta) => {
    window.history.go(delta);
    return Promise.resolve(true);
};

const block: IChaynsHistoryHandler<RootState>['block'] = () => {
    updateNativeHandling(true);
    return () => {
        updateNativeHandling();
    };
};

/**
 * Subscribe to popstate events.
 *
 * The native `popstate` listener is attached lazily on the first subscriber
 * and removed when the last subscriber unsubscribes, keeping the global
 * listener count at most 1.
 */
const addPopStateListener: IChaynsHistoryHandler<RootState>['addPopStateListener'] = (callback: PopStateCallback<RootState>) => {
    popStateCallbacks.add(callback);
    if (popStateCallbacks.size === 1) {
        window.addEventListener('popstate', popStateCallback);
    }

    return () => {
        popStateCallbacks.delete(callback);
        if (popStateCallbacks.size === 0) {
            window.removeEventListener('popstate', popStateCallback);
        }
    }
}

const initialState: RootState = {
    index: 0,
    safeRouteIndex: -1
}

/**
 * Module-level singleton that owns the native `window.history` API.
 *
 * Application code should never call `pushState` or `replaceState` on this
 * object directly.  Instead, create child handlers via `rootHistory.createChild`
 * and navigate through them; the children delegate up to this root, which
 * performs the actual `window.history` writes.
 */
export const rootHistory = new ChaynsHistoryHandler(initialState, {
    getLocation,
    getState,
    pushState,
    replaceState,
    forward,
    back,
    go,
    block,
    addPopStateListener
});
