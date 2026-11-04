import { AppleSafeArea, ChaynsReactFunctions } from '../types/IChaynsReact';
import { addAppleSafeAreaListener as addNativeAppleSafeAreaListener } from '../calls/appleSafeAreaListener';
import { addApiListener, dispatchApiEvent, removeApiListener } from '../utils/apiListener';

/** Supplies missing safe-area functions on older hosts using the existing API listener registry. */
const createAppleSafeAreaFunctions = (functions: ChaynsReactFunctions) => {
    const runtimeFunctions = functions as Partial<ChaynsReactFunctions>;
    let latestValue: AppleSafeArea | null = null;

    const addAppleSafeAreaListener: ChaynsReactFunctions['addAppleSafeAreaListener'] = (callback) => {
        const handleValue = (value: AppleSafeArea) => {
            latestValue = value;
            callback(value);
        };
        if (runtimeFunctions.addAppleSafeAreaListener) {
            return runtimeFunctions.addAppleSafeAreaListener(handleValue);
        }

        const { id, shouldInitialize } = addApiListener('appleSafeAreaListener', handleValue);
        if (latestValue) {
            callback(latestValue);
        }
        if (shouldInitialize && runtimeFunctions.invokeCall) {
            addNativeAppleSafeAreaListener({
                invokeCall: runtimeFunctions.invokeCall,
                callback: (value) => {
                    latestValue = value;
                    dispatchApiEvent('appleSafeAreaListener', value);
                },
            });
        }
        return Promise.resolve(id);
    };

    const removeAppleSafeAreaListener: ChaynsReactFunctions['removeAppleSafeAreaListener'] = (id) => {
        if (runtimeFunctions.addAppleSafeAreaListener) {
            return runtimeFunctions.removeAppleSafeAreaListener?.(id) ?? Promise.resolve();
        }
        removeApiListener('appleSafeAreaListener', id);
        return Promise.resolve();
    };

    const getAppleSafeArea: ChaynsReactFunctions['getAppleSafeArea'] = async () => {
        if (latestValue) {
            return latestValue;
        }
        if (!runtimeFunctions.addAppleSafeAreaListener && !runtimeFunctions.invokeCall) {
            return { top: 0, left: 0, bottom: 0, right: 0 };
        }

        let resolveValue!: (value: AppleSafeArea) => void;
        const result = new Promise<AppleSafeArea>((resolve) => {
            resolveValue = resolve;
        });
        const id = await addAppleSafeAreaListener(resolveValue);
        try {
            return await result;
        } finally {
            await removeAppleSafeAreaListener(id);
        }
    };

    return { addAppleSafeAreaListener, removeAppleSafeAreaListener, getAppleSafeArea };
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
