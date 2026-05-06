import { hasWindowHistory } from './window';

// ---------------------------------------------------------------------------
// Singleton state (top window only)
// ---------------------------------------------------------------------------

/** Monotonically increasing index; incremented on every pushState. */
let currentIdx = 0;

/**
 * Number of silentGo operations currently in flight.
 * Each call increments this; each matching popstate or timeout decrements it.
 * `consumeSilent` absorbs popstates while this is > 0.
 */
let pendingSilentCount = 0;

/** Resolver to call when the silentGo popstate lands. */
let silentResolve: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Navigation index
// ---------------------------------------------------------------------------

/** Increment the current index (call on every real pushState). Returns the new value. */
export function incrementIdx(): number {
    return ++currentIdx;
}

/** Get current index for stamping real entries or direction comparison. */
export function getCurrentIdx(): number {
    return currentIdx;
}

// ---------------------------------------------------------------------------
// Silent go (used to undo blocked navigations)
// ---------------------------------------------------------------------------

/**
 * Performs a `history.go(delta)` that is silently ignored by our popstate handler.
 * Returns a promise that resolves when the popstate for this go() fires.
 */
export function silentGo(delta: number): Promise<void> {
    if (!hasWindowHistory()) return Promise.resolve();

    return new Promise<void>((resolve) => {
        pendingSilentCount++;
        // The popstate handler must call `consumeSilent` to resolve.
        window.history.go(delta);

        // Safety timeout: if no popstate arrives in 2s, resolve anyway and keep
        // pendingSilentCount elevated so the eventual late popstate is still
        // absorbed rather than processed as a real navigation.
        const timeout = setTimeout(() => {
            silentResolve = null;
            resolve();
            // pendingSilentCount is intentionally NOT decremented here: the late
            // popstate (when it eventually fires) must still be consumed silently
            // to prevent a spurious navigation. consumeSilent() will decrement it.
        }, 2000);

        silentResolve = () => {
            clearTimeout(timeout);
            resolve();
        };
    });
}

/**
 * Called by the popstate handler. Returns true if this popstate is the silent one
 * and should be suppressed.
 */
export function consumeSilent(): boolean {
    if (pendingSilentCount <= 0) return false;
    pendingSilentCount--;
    const res = silentResolve;
    silentResolve = null;
    res?.();
    return true;
}
