import { ChaynsReactFunctions } from '../types/IChaynsReact';
import { getAppleSafeAreaFunctions } from '../utils/appleSafeArea';

const createAppleSafeAreaFunctions = (functions: ChaynsReactFunctions) => {
    const runtimeFunctions = functions as Partial<ChaynsReactFunctions>;
    const host = runtimeFunctions.addAppleSafeAreaListener ?? runtimeFunctions.invokeCall ?? functions;

    return getAppleSafeAreaFunctions(host, (callback) => {
        if (runtimeFunctions.addAppleSafeAreaListener) {
            return runtimeFunctions.addAppleSafeAreaListener(callback);
        }
        if (runtimeFunctions.invokeCall) {
            return runtimeFunctions.invokeCall({ action: 300 }, callback);
        }
        if (runtimeFunctions.getAppleSafeArea) {
            return runtimeFunctions.getAppleSafeArea().then(callback);
        }
        callback({ top: 0, left: 0, bottom: 0, right: 0 });
        return undefined;
    });
};

export const normalizeFunctions = (functions: ChaynsReactFunctions): ChaynsReactFunctions => {
    const runtimeFunctions = functions as Partial<ChaynsReactFunctions>;

    const hasSafeAreaFunctions = runtimeFunctions.addAppleSafeAreaListener && runtimeFunctions.removeAppleSafeAreaListener && runtimeFunctions.getAppleSafeArea;

    if (hasSafeAreaFunctions && runtimeFunctions.isTrustedUrl) {
        return functions;
    }

    const normalizedFunctions = { ...functions } as ChaynsReactFunctions;

    if (!hasSafeAreaFunctions) {
        const safeAreaFunctions = createAppleSafeAreaFunctions(functions);
        Object.assign(normalizedFunctions, safeAreaFunctions);

        if (runtimeFunctions.invokeCall) {
            const invokeCall = runtimeFunctions.invokeCall;
            normalizedFunctions.invokeCall = async (value, callback): Promise<unknown> => {
                if (value.action === 300) {
                    if (callback) {
                        await safeAreaFunctions.addAppleSafeAreaListener(callback);
                    }
                    return safeAreaFunctions.getAppleSafeArea();
                }
                return invokeCall(value, callback);
            };
        }
    }

    normalizedFunctions.isTrustedUrl = runtimeFunctions.isTrustedUrl ?? (() => Promise.resolve(true));

    return normalizedFunctions;
};
