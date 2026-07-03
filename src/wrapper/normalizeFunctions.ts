import { AppleSafeArea, ChaynsReactFunctions } from '../types/IChaynsReact';

const createAppleSafeAreaFunctions = (functions: ChaynsReactFunctions) => {
    const runtimeFunctions = functions as Partial<ChaynsReactFunctions>;
    const baseAddListener: ChaynsReactFunctions['addAppleSafeAreaListener'] = runtimeFunctions.addAppleSafeAreaListener
        ?? ((callback) => {
            if (functions.invokeCall) {
                void functions.invokeCall({ action: 300 }, callback);
            }

            return Promise.resolve(-1);
        });
    const baseRemoveListener: ChaynsReactFunctions['removeAppleSafeAreaListener'] = runtimeFunctions.removeAppleSafeAreaListener
        ?? (() => Promise.resolve());

    let upstreamListenerId: Promise<number> | null = null;
    let hasLatestValue = false;
    let latestValue: AppleSafeArea | null = null;
    let counter = 0;
    const listeners: Record<number, (result: AppleSafeArea) => void> = {};

    const dispatch = (value: AppleSafeArea) => {
        latestValue = value;
        hasLatestValue = true;
        Object.values(listeners).forEach((listener) => listener(value));
    };

    const addAppleSafeAreaListener: ChaynsReactFunctions['addAppleSafeAreaListener'] = (callback) => {
        const id = ++counter;
        listeners[id] = callback;

        if (hasLatestValue && latestValue) {
            callback(latestValue);
        }

        if (!upstreamListenerId) {
            upstreamListenerId = baseAddListener((result) => {
                dispatch(result);
            });
        }

        return Promise.resolve(id);
    };

    const removeAppleSafeAreaListener: ChaynsReactFunctions['removeAppleSafeAreaListener'] = (id) => {
        delete listeners[id];

        if (Object.keys(listeners).length === 0 && upstreamListenerId) {
            void upstreamListenerId.then((listenerId) => baseRemoveListener(listenerId));
            upstreamListenerId = null;
        }

        return Promise.resolve();
    };

    return {
        addAppleSafeAreaListener,
        removeAppleSafeAreaListener,
    };
};

export const normalizeFunctions = (functions: ChaynsReactFunctions): ChaynsReactFunctions => {
    const runtimeFunctions = functions as Partial<ChaynsReactFunctions>;

    if (runtimeFunctions.addAppleSafeAreaListener && runtimeFunctions.removeAppleSafeAreaListener) {
        return functions;
    }

    const safeAreaFunctions = createAppleSafeAreaFunctions(functions);

    return {
        ...functions,
        addAppleSafeAreaListener: runtimeFunctions.addAppleSafeAreaListener ?? safeAreaFunctions.addAppleSafeAreaListener,
        removeAppleSafeAreaListener: runtimeFunctions.removeAppleSafeAreaListener ?? safeAreaFunctions.removeAppleSafeAreaListener,
    };
};
