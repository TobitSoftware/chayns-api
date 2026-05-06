// ---------------------------------------------------------------------------
// Public type exports
// ---------------------------------------------------------------------------

export type {
    ChaynsHistoryLayer,
    ChaynsHistoryNavigateOptions,
    ChaynsHistoryNavigationCommitOptions,
    ChaynsHistoryBlockOptions,
    ChaynsHistoryLayerEvent,
    ChaynsHistoryLayerStateNode,
} from './types';

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export { initRootChaynsHistoryLayer, getOrInitRootChaynsHistoryLayer, type InitRootChaynsHistoryLayerOptions, type InitRootChaynsHistoryLayerResult } from './initRootLayer';
export { ChaynsHistoryLayer as ChaynsHistoryLayerClass } from './HistoryLayer';
export { FrameHistoryLayer, type HistoryBridgeFunctions, type HistoryInitialState } from './FrameHistoryLayer';
export { NavigationQueue } from './NavigationQueue';
export { BlockRegistry } from './BlockRegistry';

// ---------------------------------------------------------------------------
// React
// ---------------------------------------------------------------------------

export {
    ChaynsHistoryLayerProvider,
    ChaynsHistoryLayerOverrideProvider,
    type ChaynsHistoryLayerProviderProps,
    getCurrentChaynsHistoryLayer,
} from './react/HistoryLayerContext';

export {
    useChaynsHistoryLayer,
    useChaynsHistoryRoute,
    useChaynsHistoryParams,
    useChaynsHistoryHash,
    useChaynsHistoryState,
    useChaynsHistoryNavigate,
    useChaynsHistoryBlock,
    useChaynsHistoryEvent,
    useChaynsHistoryChildLayer,
    useChaynsHistoryActiveChild,
    type UseChaynsHistoryRouteResult,
    type UseChaynsHistoryActiveChildResult,
    type UseChaynsHistoryBlockOptions,
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
export { getChaynsHistoryActiveChain, findChaynsHistoryLayerById, isInChaynsHistoryActiveChain } from './LayerTree';

// ---------------------------------------------------------------------------
// Debug (dev only)
// ---------------------------------------------------------------------------

export { debugTree, debugQueue, installWindowDebugGlobal } from './debug/index';

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export { hasWindow } from './guards/ssr';
export { devWarn } from './guards/devWarn';
