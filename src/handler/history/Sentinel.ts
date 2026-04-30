import { hasWindow } from './guards/ssr';
import { devWarn } from './guards/devWarn';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOT_KEY = '__chaynsHistory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SentinelState {
    __isSentinel: true;
    __idx: number;
    realRef: string;
}

// ---------------------------------------------------------------------------
// Singleton state (top window only)
// ---------------------------------------------------------------------------

/** Monotonically increasing index; incremented on every push (not replace). */
let currentIdx = 0;

/** Whether a `silentGo` is in flight (suppresses popstate handling). */
let isSilentPending = false;

/** Resolver to call when the silentGo popstate lands. */
let silentResolve: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Call once at startup to sync currentIdx from the already-loaded state.
 * If the page loaded on a real entry or sentinel, read the idx from state.
 */
export function initSentinelIdx(): void {
    if (!hasWindow()) return;
    const raw = window.history.state;
    if (raw && typeof raw === 'object') {
        const hist = (raw as Record<string, unknown>)[ROOT_KEY];
        if (hist && typeof hist === 'object') {
            const idx = (hist as Record<string, unknown>).__idx;
            if (typeof idx === 'number') {
                currentIdx = idx;
                return;
            }
        }
    }
    currentIdx = 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pushes a sentinel entry immediately after a real push.
 * The sentinel entry has the same URL as the current page.
 */
export function pushSentinel(
    existingState: Record<string, unknown>,
    realEntryId: string,
): void {
    if (!hasWindow()) return;
    const sentinelState: Record<string, unknown> = {
        ...existingState,
        [ROOT_KEY]: {
            ...(existingState[ROOT_KEY] as object | undefined),
            __isSentinel: true,
            __idx: currentIdx,
            realRef: realEntryId,
        },
    };
    window.history.pushState(sentinelState, '', window.location.href);
}

/**
 * Returns true when the given raw history state represents a sentinel entry.
 */
export function isSentinel(raw: unknown): raw is { [key: string]: unknown } {
    if (!raw || typeof raw !== 'object') return false;
    const hist = (raw as Record<string, unknown>)[ROOT_KEY];
    if (!hist || typeof hist !== 'object') return false;
    return (hist as Record<string, unknown>).__isSentinel === true;
}

/**
 * Returns the sentinel data (direction + realRef) from a raw sentinel state,
 * or null if not a sentinel.
 */
export function getSentinelData(raw: unknown): { idx: number; realRef: string } | null {
    if (!isSentinel(raw)) return null;
    const hist = (raw as Record<string, unknown>)[ROOT_KEY] as Record<string, unknown>;
    const idx = hist.__idx as number;
    const realRef = hist.realRef as string;
    return { idx, realRef };
}

/**
 * Determines navigation direction based on the incoming entry's index vs currentIdx.
 */
export function getSentinelDirection(incomingIdx: number): 'back' | 'forward' {
    return incomingIdx < currentIdx ? 'back' : 'forward';
}

/**
 * Performs a `history.go(delta)` that is silently ignored by our popstate handler.
 * Returns a promise that resolves when the popstate for this go() fires.
 */
export function silentGo(delta: number): Promise<void> {
    if (!hasWindow()) return Promise.resolve();

    return new Promise<void>((resolve) => {
        isSilentPending = true;
        silentResolve = resolve;
        // The popstate handler must call `consumeSilent` to resolve.
        window.history.go(delta);

        // Safety timeout: if no popstate arrives in 2s, resolve anyway.
        const timeout = setTimeout(() => {
            if (isSilentPending) {
                devWarn('SENTINEL_GO_TIMEOUT', `silentGo(${delta}) did not fire popstate in 2s.`);
                consumeSilent();
                resolve();
            }
        }, 2000);

        // Override resolve to also clear the timeout.
        silentResolve = () => {
            clearTimeout(timeout);
            resolve();
        };
    });
}

/**
 * Called by the popstate handler. Returns true if this popstate is the silent one.
 */
export function consumeSilent(): boolean {
    if (!isSilentPending) return false;
    isSilentPending = false;
    const res = silentResolve;
    silentResolve = null;
    res?.();
    return true;
}

/** Increment the current index (call on every real pushState). */
export function incrementIdx(): void {
    currentIdx++;
}

/** Get current index for stamping real entries. */
export function getCurrentIdx(): number {
    return currentIdx;
}
