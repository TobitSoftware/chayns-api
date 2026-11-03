import { AppleSafeArea, ChaynsReactFunctions } from '../types/IChaynsReact';
import invokeAppCall from './appCall';

type AppleSafeAreaFunctions = Pick<ChaynsReactFunctions, 'addAppleSafeAreaListener' | 'removeAppleSafeAreaListener' | 'getAppleSafeArea'>;
type SafeAreaCallback = (value: AppleSafeArea) => void;
type Subscribe = (callback: SafeAreaCallback) => unknown;

const channels = new WeakMap<object, AppleSafeAreaFunctions>();

/** Shares one upstream subscription and the latest value for each native host. */
export const getAppleSafeAreaFunctions = (host: object, subscribe: Subscribe): AppleSafeAreaFunctions => {
    const existing = channels.get(host);
    if (existing) {
        return existing;
    }

    let latestValue: AppleSafeArea | undefined;
    let initialValue: Promise<AppleSafeArea> | undefined;
    let counter = 0;
    const listeners = new Map<number, SafeAreaCallback>();

    const ensureStarted = (): Promise<AppleSafeArea> => {
        if (initialValue) {
            return initialValue;
        }

        let resolveInitial!: (value: AppleSafeArea) => void;
        let rejectInitial!: (error: unknown) => void;
        const pending = new Promise<AppleSafeArea>((resolve, reject) => {
            resolveInitial = resolve;
            rejectInitial = reject;
        });
        initialValue = pending;

        // Listener-only consumers do not await the first native result.
        void pending.catch((error: unknown) => {
            console.error('[chayns-api] Failed to initialize Apple safe-area updates', error);
        });

        const handleError = (error: unknown) => {
            initialValue = undefined;
            rejectInitial(error);
        };

        try {
            const registration = subscribe((value) => {
                latestValue = value;
                resolveInitial(value);
                Array.from(listeners.values()).forEach((listener) => listener(value));
            });
            void Promise.resolve(registration).catch(handleError);
        } catch (error) {
            handleError(error);
        }

        return pending;
    };

    const functions: AppleSafeAreaFunctions = {
        addAppleSafeAreaListener: (callback) => {
            const id = ++counter;
            listeners.set(id, callback);

            if (latestValue) {
                callback(latestValue);
            }
            void ensureStarted();

            return Promise.resolve(id);
        },
        removeAppleSafeAreaListener: (id) => {
            listeners.delete(id);
            // Call 300 cannot unsubscribe natively. Keep its callback and cache alive.
            return Promise.resolve();
        },
        getAppleSafeArea: () => {
            if (latestValue) {
                return Promise.resolve(latestValue);
            }
            return ensureStarted();
        },
    };

    channels.set(host, functions);
    return functions;
};

type NativeSafeAreaValue = Partial<AppleSafeArea>;
type NativeSafeAreaResponse = (NativeSafeAreaValue & { retVal?: NativeSafeAreaValue | null }) | null | undefined;
type SafeAreaWindow = Window & { chaynsApiAppleSafeAreaCallback?: (response: NativeSafeAreaResponse) => void };

/** Uses a dedicated callback name so other AppWrapper instances cannot overwrite it. */
export const getAppAppleSafeAreaFunctions = (): AppleSafeAreaFunctions => {
    const host = window as SafeAreaWindow;
    return getAppleSafeAreaFunctions(host, (callback) => {
        host.chaynsApiAppleSafeAreaCallback = (response) => {
            const value = response?.retVal ?? response;
            callback({
                top: value?.top ?? 0,
                left: value?.left ?? 0,
                bottom: value?.bottom ?? 0,
                right: value?.right ?? 0,
                ...(value?.hingeAngle === undefined ? {} : { hingeAngle: value.hingeAngle }),
                ...(value?.hingeStatus === undefined ? {} : { hingeStatus: value.hingeStatus }),
            });
        };
        invokeAppCall({ action: 300, value: { callback: 'window.chaynsApiAppleSafeAreaCallback' } });
    });
};
