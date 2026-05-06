import { ChaynsHistoryLayer } from '../../src/handler/history/HistoryLayer';
import { BlockRegistry } from '../../src/utils/history/BlockRegistry';
import type { NavigationQueue } from '../../src/utils/history/NavigationQueue';
import type { ChaynsHistoryLayerDeps } from '../../src/handler/history/HistoryLayer';
import type { ChaynsHistoryLayer as IChaynsHistoryLayer } from '../../src/types/history';

export interface TestTree {
    root: ChaynsHistoryLayer;
    blockRegistry: BlockRegistry;
    enqueuedOps: unknown[];
}

/** Creates a root ChaynsHistoryLayer backed by a stub queue (no real history ops). */
export function makeTestTree(rootSegmentCount = 0, rootSegments: string[] = []): TestTree {
    const enqueuedOps: unknown[] = [];
    const blockRegistry = new BlockRegistry();
    let root: ChaynsHistoryLayer;

    const deps: ChaynsHistoryLayerDeps = {
        getRoot: () => root,
        getQueue: () =>
            ({
                enqueue: (op: unknown) => {
                    enqueuedOps.push(op);
                    return Promise.resolve({ isOk: true as const });
                },
            }) as unknown as NavigationQueue,
        getBlockRegistry: () => blockRegistry,
    };

    root = new ChaynsHistoryLayer({
        id: 'root',
        parent: null,
        deps,
        segmentCount: rootSegmentCount,
        segments: rootSegments,
    });

    return { root, blockRegistry, enqueuedOps };
}

/** Minimal mock of a layer for BlockRegistry tests. */
export function mockLayer(
    id: string,
    activeChildId: string | null = null,
    children: Record<string, IChaynsHistoryLayer> = {},
): IChaynsHistoryLayer {
    return {
        id,
        depth: 0,
        getActiveChildId: () => activeChildId,
        getChildLayer: (childId: string) => children[childId],
        getSegmentCount: () => 0,
        setSegmentCount: () => {},
        createChildLayer: () => {
            throw new Error('not implemented in mock');
        },
        destroyChildLayer: () => {},
        setActiveChild: () => {},
        getRoute: () => [],
        setRoute: () => {},
        getParams: () => ({}),
        setParams: () => {},
        getHash: () => '',
        setHash: () => {},
        getState: () => undefined,
        setState: () => {},
        navigate: () => {},
        addBlock: () => () => {},
        addEventListener: () => () => {},
    } as unknown as IChaynsHistoryLayer;
}
