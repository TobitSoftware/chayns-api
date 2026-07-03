import { AppleSafeArea, ChaynsReactFunctions } from '../types/IChaynsReact';

const createAppleSafeAreaFallback = (invokeCall: ChaynsReactFunctions['invokeCall'] | undefined) => {
    let initialized = false;
    let counter = 0;
    const listeners: Record<number, (result: AppleSafeArea) => void> = {};

    const dispatch = (value: AppleSafeArea) => {
        Object.values(listeners).forEach((listener) => listener(value));
    };

    const addAppleSafeAreaListener: ChaynsReactFunctions['addAppleSafeAreaListener'] = (callback) => {
        const id = ++counter;
        listeners[id] = callback;

        if (!initialized && invokeCall) {
            initialized = true;
            void invokeCall({ action: 300 }, (result: AppleSafeArea) => {
                dispatch(result);
            });
        }

        return Promise.resolve(id);
    };

    const removeAppleSafeAreaListener: ChaynsReactFunctions['removeAppleSafeAreaListener'] = (id) => {
        delete listeners[id];
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

    const safeAreaFallback = createAppleSafeAreaFallback(functions.invokeCall);

    return {
        ...functions,
        addAppleSafeAreaListener: runtimeFunctions.addAppleSafeAreaListener ?? safeAreaFallback.addAppleSafeAreaListener,
        removeAppleSafeAreaListener: runtimeFunctions.removeAppleSafeAreaListener ?? safeAreaFallback.removeAppleSafeAreaListener,
    };
};
