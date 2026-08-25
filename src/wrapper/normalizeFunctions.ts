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

    const baseGetSafeArea = runtimeFunctions.getAppleSafeArea;

    const getAppleSafeArea: ChaynsReactFunctions['getAppleSafeArea'] = async () => {
        if (hasLatestValue && latestValue) {
            return latestValue;
        }

        if (baseGetSafeArea) {
            const result = await baseGetSafeArea();
            dispatch(result);
            return result;
        }

        const fallback: AppleSafeArea = { top: 0, left: 0, bottom: 0, right: 0 };
        return fallback;
    };

    return {
        addAppleSafeAreaListener,
        removeAppleSafeAreaListener,
        getAppleSafeArea,
    };
};

export const normalizeFunctions = (functions: ChaynsReactFunctions): ChaynsReactFunctions => {
    const runtimeFunctions = functions as Partial<ChaynsReactFunctions>;

    const hasSafeAreaFunctions = runtimeFunctions.addAppleSafeAreaListener
        && runtimeFunctions.removeAppleSafeAreaListener
        && runtimeFunctions.getAppleSafeArea;

    if (hasSafeAreaFunctions && runtimeFunctions.isTrustedUrl) {
        return functions;
    }

    const normalizedFunctions = { ...functions } as ChaynsReactFunctions;

    if (!hasSafeAreaFunctions) {
        Object.assign(normalizedFunctions, createAppleSafeAreaFunctions(functions));
    }

    normalizedFunctions.isTrustedUrl = runtimeFunctions.isTrustedUrl ?? (() => Promise.resolve(true));

    return normalizedFunctions;
};
