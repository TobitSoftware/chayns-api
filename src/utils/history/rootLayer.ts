import { ChaynsHistoryLayer } from '../../handler/history/HistoryLayer';
import { NavigationQueue } from './NavigationQueue';
import { BlockRegistry } from './BlockRegistry';
import { findChaynsHistoryLayerById } from './layerTree';
import { projectToUrl, parseFromUrl } from './url';
import { projectToState, applyStateToTree, diffIncomingState, hasChaynsHistoryState } from './stateProjector';
import { silentGo, consumeSilent, incrementIdx, getCurrentIdx, syncCurrentIdxFromState } from './navigationIndex';
import { hasWindowHistory } from './window';
import { shallowEqualArr } from '../equality';
import { getSite } from '../../calls';
import { normalizeHistorySegments } from './segments';
import { NativeBackHandler } from './nativeBackHandling';

/** Resolves the initial page pathname for bootstrap URL parsing.
 *  Priority: explicit `url` option → window.location (browser) → getSite().url (SSR fallback). */
function getInitialPathname(overrideUrl?: string): string {
    if (overrideUrl) {
        try { return new URL(overrideUrl).pathname; } catch { /* relative path */ }
        return overrideUrl.startsWith('/') ? overrideUrl : `/${overrideUrl}`;
    }
    if (hasWindowHistory()) {
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

/** Parses the URL into a flat segment array and returns the first `n` entries. */
function resolveInitialSegments(overrideUrl: string | undefined, n: number): string[] {
    const pathname = getInitialPathname(overrideUrl);
    const all = pathname.replace(/^\//, '').split('/').filter(Boolean);
    const taken = all.slice(0, n);
    while (taken.length < n) taken.push('');
    return taken;
}

/** Parses the URL into a flat segment array and returns all entries after the first `startIndex` entries. */
export function resolveSegmentsFrom(
    overrideUrl: string | undefined,
    startIndex: number,
): string[] {
    const pathname = getInitialPathname(overrideUrl);

    const all = pathname
        .replace(/^\//, '')
        .split('/')
        .filter(Boolean);

    return all.slice(startIndex);
}

export interface InitRootChaynsHistoryLayerOptions {
    /**
     * The current page URL used to seed initial route segments.
     * - **Browser**: defaults to `window.location.pathname` — no need to set this.
     * - **SSR**: pass the request URL (e.g. `req.url` or `router.asPath`) so
     *   child layers receive the correct initial segments on the server.
     */
    url?: string;
    /**
     * Number of URL path segments the root layer owns.
     * When provided, segments are resolved from the URL immediately at construction
     * so that `getRoute()` is populated on the very first render.
     */
    segmentCount?: number;
}

export interface InitRootChaynsHistoryLayerResult {
    rootLayer: ChaynsHistoryLayer;
}

/**
 * Initializes the root ChaynsHistoryLayer for the top window.
 * - Reads `window.location.pathname` and `window.history.state`.
 * - If `__chaynsHistory` is absent, replaces the current state with an empty tree.
 * - Attaches the global `popstate` listener.
 * - Returns the root ChaynsHistoryLayer instance.
 *
 * Call once at application startup (top window only).
 */
export function initRootChaynsHistoryLayer(opts: InitRootChaynsHistoryLayerOptions = {}): InitRootChaynsHistoryLayerResult {
    const blockRegistry = new BlockRegistry();

    // Wired lazily so queue and root can reference each other.
    let queueRef: NavigationQueue | null = null;

    const deps = {
        getRoot: () => rootLayer,
        getQueue: () => {
            if (!queueRef) {
                throw new Error('[chaynsHistory] NavigationQueue not initialized yet.');
            }

            return queueRef;
        },
        getBlockRegistry: () => blockRegistry,
    };

    const rootLayer = new ChaynsHistoryLayer({
        id: 'root',
        parent: null,
        deps,
        segmentCount: opts.segmentCount ?? 0,
        segments: opts.segmentCount ? resolveInitialSegments(opts.url, opts.segmentCount) : [],
    });

    const nativeBackHandler = new NativeBackHandler({ rootLayer, blockRegistry });
    const syncNativeHandling = nativeBackHandler.sync;

    const queue = new NavigationQueue({
        getRoot: () => rootLayer,
        findLayer: (id) => findChaynsHistoryLayerById(rootLayer, id),
        checkBlocks: (target) => blockRegistry.checkBlocks(target),
        projectUrl: () => projectToUrl(rootLayer),
        projectState: () => {
            const existing = hasWindowHistory()
                ? ({ ...(window.history.state as Record<string, unknown> | null ?? {}) })
                : {};
            // Remove our own key before re-projecting so it doesn't get stale.
            delete existing.__chaynsHistory;
            return projectToState(rootLayer, existing);
        },
        diffIncomingState: (raw) => diffIncomingState(rootLayer, raw),
        applyIncomingState: (raw) => applyStateToTree(rootLayer, raw),
        silentGo: (delta) => silentGo(delta),
        getCurrentIdx: () => getCurrentIdx(),
        incrementIdx: () => incrementIdx(),
        onCommit: syncNativeHandling,
        applyUrlSegments: () => {
            if (!hasWindowHistory()) return { changedLayerIds: new Set<string>() };
            const { perLayerSegments } = parseFromUrl(window.location.pathname, rootLayer);
            const changed = new Set<string>();
            for (const [id, segs] of perLayerSegments) {
                const layer = findChaynsHistoryLayerById(rootLayer, id);
                if (!layer) continue;
                const normalizedSegs = normalizeHistorySegments(segs);
                const prev = layer._getOwnSegments();
                if (!shallowEqualArr(prev, normalizedSegs)) {
                    layer._setOwnSegmentsSilent(normalizedSegs);
                    changed.add(id);
                }
            }
            return { changedLayerIds: changed };
        },
    });

    queueRef = queue;


    // Bootstrap: sync memory tree from existing history state or initialize fresh.
    // Seed the bootstrap URL pool first (works in both browser and SSR).
    const existingState = hasWindowHistory()
        ? (window.history.state as Record<string, unknown> | null)
        : null;

    syncCurrentIdxFromState(existingState);

    if (!hasChaynsHistoryState(existingState)) {
        // Seed the bootstrap pool for child layers. The root layer already has its
        // segments set in the constructor, so the pool starts after those segments.
        const segmentCount = opts.segmentCount ?? 0;
        if (segmentCount > 0) {
            // URL was already resolved synchronously — build the pool directly,
            // skipping the segments the root layer already claimed.
            const pathname = getInitialPathname(opts.url);
            const all = pathname.replace(/^\//, '').split('/').filter(Boolean);
            rootLayer._setBootstrapPool(all.slice(segmentCount));
        } else {
            // No segmentCount provided: register a lazy resolver so child layers
            // can still consume segments when they set their segmentCount later.
            rootLayer._setBootstrapUrlResolver(() => getInitialPathname(opts.url));
        }

        // Eagerly bootstrap params/hash from the initial URL onto the root layer.
        // Unlike segments (which are distributed across layers), params/hash are
        // global and assigned to root immediately.
        const rawUrl = opts.url ?? (hasWindowHistory() ? window.location.href : null);
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

    if (hasWindowHistory()) {
        const existing = existingState;

        if (!hasChaynsHistoryState(existing)) {
            // Write an initial state with __idx stamped on it.
            const foreign = { ...(existing ?? {}) };
            delete foreign.__chaynsHistory;
            const initialState = projectToState(rootLayer, foreign);
            const idx = getCurrentIdx();
            window.history.replaceState(
                { ...initialState, __chaynsHistory: { ...(initialState.__chaynsHistory as object), __idx: idx } },
                '',
                window.location.href,
            );
        } else {
            // Restore tree from existing state.
            applyStateToTree(rootLayer, existing);

            if (syncCurrentIdxFromState(existing) === null) {
                const foreign = { ...(existing ?? {}) };
                delete foreign.__chaynsHistory;
                const currentState = projectToState(rootLayer, foreign);
                const idx = getCurrentIdx();
                window.history.replaceState(
                    { ...currentState, __chaynsHistory: { ...(currentState.__chaynsHistory as object), __idx: idx } },
                    '',
                    window.location.href,
                );
            }
        }

        blockRegistry.subscribeToChanges(syncNativeHandling);

        // Attach popstate listener.
        window.addEventListener('popstate', (event: PopStateEvent) => {
            syncCurrentIdxFromState(event.state);

            // If a silentGo is in progress, absorb this event.
            if (consumeSilent()) {
                syncNativeHandling();
                return;
            }

            const raw: unknown = event.state;

            if (!hasChaynsHistoryState(raw)) {
                // Foreign push — ignore and keep memory tree as truth.
                syncNativeHandling();
            } else {
                const skipBlockCheck = nativeBackHandler.consumeBypassFlag();
                void queue
                    .enqueue({ kind: 'popstate', rawState: raw, skipBlockCheck })
                    .finally(syncNativeHandling);
            }
        });

        syncNativeHandling();
    }

    return { rootLayer };
}

let _rootLayerResult: InitRootChaynsHistoryLayerResult | null = null;

/**
 * Returns the singleton root ChaynsHistoryLayer for the current window.
 * Creates it on first call; subsequent calls return the same instance.
 *
 * @param url - On SSR, pass the current request URL (e.g. `req.url` or `router.asPath`)
 *   so child layers receive the correct initial route segments. Ignored after first call.
 * @param segmentCount - Number of URL segments the root layer owns. When provided the
 *   segments are resolved from the URL immediately so `getRoute()` is populated on the
 *   very first render without any subsequent `setSegmentCount` call. Ignored after first call.
 */
export function getOrInitRootChaynsHistoryLayer(url?: string, segmentCount?: number): InitRootChaynsHistoryLayerResult {
    if (!_rootLayerResult) {
        _rootLayerResult = initRootChaynsHistoryLayer({ url, segmentCount });
    }
    return _rootLayerResult;
}
