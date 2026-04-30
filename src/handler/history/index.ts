// ---------------------------------------------------------------------------
// Public type exports
// ---------------------------------------------------------------------------

export type {
    HistoryLayer,
    NavigateOptions,
    NavigationCommitOptions,
    BlockOptions,
    HistoryLayerEvent,
    LayerStateNode,
} from './types';

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export { initRootLayer, getOrInitRootLayer, type InitRootLayerOptions, type InitRootLayerResult } from './initRootLayer';
export { HistoryLayer as HistoryLayerClass } from './HistoryLayer';
export { NavigationQueue } from './NavigationQueue';
export { BlockRegistry } from './BlockRegistry';

// ---------------------------------------------------------------------------
// React
// ---------------------------------------------------------------------------

export {
    HistoryLayerProvider,
    type HistoryLayerProviderProps,
    getCurrentLayer,
} from './react/HistoryLayerContext';

export {
    useHistoryLayer,
    useRoute,
    useParams,
    useHash,
    useHistoryState,
    useNavigate,
    useHistoryBlock,
    useHistoryEvent,
    useChildLayer,
    useActiveChild,
    type UseRouteResult,
    type UseActiveChildResult,
    type UseHistoryBlockOptions,
} from './react/hooks';

// ---------------------------------------------------------------------------
// Projectors (for advanced / host integration use)
// ---------------------------------------------------------------------------

export { projectToUrl, parseFromUrl } from './UrlProjector';
export {
    projectToState,
    applyStateToTree,
    diffIncomingState,
    hasChaynsHistoryState,
} from './StateProjector';
export { getActiveChain, findLayerById, isInActiveChain } from './LayerTree';

// ---------------------------------------------------------------------------
// Debug (dev only)
// ---------------------------------------------------------------------------

export { debugTree, debugQueue, installWindowDebugGlobal } from './debug/index';

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export { hasWindow } from './guards/ssr';
export { devWarn } from './guards/devWarn';
