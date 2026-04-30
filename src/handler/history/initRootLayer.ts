import { HistoryLayer } from './HistoryLayer';
import { NavigationQueue } from './NavigationQueue';
import { BlockRegistry } from './BlockRegistry';
import { findLayerById } from './LayerTree';
import { projectToUrl } from './UrlProjector';
import { projectToState, applyStateToTree, diffIncomingState, hasChaynsHistoryState } from './StateProjector';
import {
    initSentinelIdx,
    pushSentinel,
    isSentinel,
    getSentinelData,
    getSentinelDirection,
    silentGo,
    consumeSilent,
    incrementIdx,
} from './Sentinel';
import { hasWindow } from './guards/ssr';
import { devWarn } from './guards/devWarn';
import { debugTree, debugQueue, installWindowDebugGlobal } from './debug';
import {getSite} from "../../calls";

/** Resolves the initial page pathname for bootstrap URL parsing.
 *  Priority: explicit `url` option → window.location (browser) → getSite().url (SSR fallback). */
function getInitialPathname(overrideUrl?: string): string {
    if (overrideUrl) {
        try { return new URL(overrideUrl).pathname; } catch { /* relative path */ }
        return overrideUrl.startsWith('/') ? overrideUrl : `/${overrideUrl}`;
    }
    if (hasWindow()) {
        return window.location.pathname;
    }
    try {
        const siteUrl = getSite().url;
        if (siteUrl) return new URL(siteUrl).pathname;
    } catch {
        // moduleWrapper not yet initialised or URL parse failed — fall through
    }
    return '/';
}

export interface InitRootLayerOptions {
    /**
     * The current page URL used to seed initial route segments.
     * - **Browser**: defaults to `window.location.pathname` — no need to set this.
     * - **SSR**: pass the request URL (e.g. `req.url` or `router.asPath`) so
     *   child layers receive the correct initial segments on the server.
     */
    url?: string;
}

export interface InitRootLayerResult {
    rootLayer: HistoryLayer;
    /** Returns a JSON-serializable snapshot of the full layer tree (dev only). */
    __debugTree: () => unknown;
    /** Returns the pending ops in the navigation queue (dev only). */
    __debugQueue: () => unknown[];
}

/**
 * Initializes the root HistoryLayer for the top window.
 * - Reads `window.location.pathname` and `window.history.state`.
 * - If `__chaynsHistory` is absent, replaces the current state with an empty tree.
 * - Attaches the global `popstate` listener.
 * - Returns the root HistoryLayer instance.
 *
 * Call once at application startup (top window only).
 */
export function initRootLayer(opts: InitRootLayerOptions = {}): InitRootLayerResult {
    const blockRegistry = new BlockRegistry();

    // Wired lazily so queue and root can reference each other.
    let rootLayer: HistoryLayer;
    let queue: NavigationQueue;

    const deps = {
        getRoot: () => rootLayer,
        getQueue: () => queue,
        getBlockRegistry: () => blockRegistry,
    };

    rootLayer = new HistoryLayer({
        id: 'root',
        parent: null,
        deps,
        segmentCount: 0,
    });

    queue = new NavigationQueue({
        getRoot: () => rootLayer,
        findLayer: (id) => findLayerById(rootLayer, id),
        checkBlocks: (target) => blockRegistry.checkBlocks(target),
        projectUrl: () => projectToUrl(rootLayer),
        projectState: () => {
            const existing = hasWindow()
                ? ({ ...(window.history.state as Record<string, unknown> | null ?? {}) })
                : {};
            // Remove our own key before re-projecting so it doesn't get stale.
            delete existing.__chaynsHistory;
            return projectToState(rootLayer, existing);
        },
        diffIncomingState: (raw) => diffIncomingState(rootLayer, raw),
        applyIncomingState: (raw) => applyStateToTree(rootLayer, raw),
        pushSentinel: (projectedState, entryId) => {
            incrementIdx();
            pushSentinel(projectedState, entryId);
        },
        silentGo: (delta) => silentGo(delta),
    });


    // Bootstrap: sync memory tree from existing history state or initialize fresh.
    // Seed the bootstrap URL pool first (works in both browser and SSR).
    const existingState = hasWindow()
        ? (window.history.state as Record<string, unknown> | null)
        : null;

    if (!hasChaynsHistoryState(existingState)) {
        // Register a lazy URL resolver so segments are parsed the first time a child
        // layer needs them — by then moduleWrapper / getSite() will be available.
        rootLayer._setBootstrapUrlResolver(() => getInitialPathname(opts.url));

        // Eagerly bootstrap params/hash from the initial URL onto the root layer.
        // Unlike segments (which are distributed across layers), params/hash are
        // global and assigned to root immediately.
        const rawUrl = opts.url ?? (hasWindow() ? window.location.href : null);
        if (rawUrl) {
            try {
                const base = rawUrl.startsWith('http') ? rawUrl : `http://x${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
                const parsed = new URL(base);
                const params: Record<string, string> = {};
                parsed.searchParams.forEach((v, k) => { params[k] = v; });
                if (Object.keys(params).length > 0) rootLayer._setOwnParamsSilent(params);
                const hash = parsed.hash.replace(/^#/, '');
                if (hash) rootLayer._setOwnHashSilent(hash);
            } catch { /* ignore */ }
        }
    }

    if (hasWindow()) {
        initSentinelIdx();

        const existing = existingState;

        if (!hasChaynsHistoryState(existing)) {
            // Write an initial state and sentinel.
            const foreign = { ...(existing ?? {}) };
            delete foreign.__chaynsHistory;
            const initialState = projectToState(rootLayer, foreign);
            const entryId = `real-root-${Date.now()}`;
            window.history.replaceState(
                { ...initialState, __chaynsHistory: { ...(initialState.__chaynsHistory as object), __entryId: entryId } },
                '',
                window.location.href,
            );
            // Push initial sentinel.
            incrementIdx();
            pushSentinel(initialState, entryId);
        } else {
            // Restore tree from existing state.
            applyStateToTree(rootLayer, existing);
        }

        // Attach popstate listener.
        window.addEventListener('popstate', (event: PopStateEvent) => {
            // If a silentGo is in progress, absorb this event.
            if (consumeSilent()) return;

            const raw = event.state;

            if (isSentinel(raw)) {
                const data = getSentinelData(raw);
                if (!data) return;
                const direction = getSentinelDirection(data.idx);
                void queue.enqueue({ kind: 'sentinelCorrection', direction });
            } else if (!hasChaynsHistoryState(raw)) {
                // Foreign push — ignore and keep memory tree as truth.
                devWarn(
                    'FOREIGN_POPSTATE',
                    'Received popstate without __chaynsHistory — ignoring. Memory tree is authoritative.',
                );
            } else {
                void queue.enqueue({ kind: 'popstate', rawState: raw });
            }
        });

        // Install dev console globals.
        installWindowDebugGlobal(rootLayer, queue);
    }

    return {
        rootLayer,
        /** Returns a JSON-serializable snapshot of the full layer tree. */
        __debugTree: () => debugTree(rootLayer),
        /** Returns the pending ops in the navigation queue. */
        __debugQueue: () => debugQueue(queue),
    };
}

let _rootLayerResult: InitRootLayerResult | null = null;

/**
 * Returns the singleton root HistoryLayer for the current window.
 * Creates it on first call; subsequent calls return the same instance.
 *
 * @param url - On SSR, pass the current request URL (e.g. `req.url` or `router.asPath`)
 *   so child layers receive the correct initial route segments. Ignored after first call.
 */
export function getOrInitRootLayer(url?: string): InitRootLayerResult {
    if (!_rootLayerResult) {
        _rootLayerResult = initRootLayer({ url });
    }
    return _rootLayerResult;
}
