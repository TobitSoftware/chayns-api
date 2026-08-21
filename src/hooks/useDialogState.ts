import { useMemo } from 'react';
import { ChaynsReactFunctions, DialogCloseRequestEvent, DialogHookResult } from '../types/IChaynsReact';
import { useFunctionsSelector, useValuesSelector } from './context';

const closeRequestListeners: ((event: DialogCloseRequestEvent) => void)[] = [];
let hostListenerId: Promise<number> | null = null;

const dispatchCloseRequest = (data: { reason: DialogCloseRequestEvent['reason'] }) => {
    let isPropagationStopped = false;
    const event: DialogCloseRequestEvent = {
        reason: data.reason,
        stopPropagation: () => {
            isPropagationStopped = true;
        },
    };
    const listeners = [...closeRequestListeners].reverse();
    for (const listener of listeners) {
        listener(event);
        if (isPropagationStopped) {
            break;
        }
    }
};

const createAddCloseRequestListener = (functions: Pick<ChaynsReactFunctions, 'addDialogCloseRequestListener' | 'removeDialogCloseRequestListener'>): DialogHookResult['addCloseRequestListener'] => (listener) => {
    closeRequestListeners.push(listener);

    if (closeRequestListeners.length === 1) {
        if (!hostListenerId) {
            hostListenerId = functions.addDialogCloseRequestListener?.(dispatchCloseRequest) ?? null;
        }
    }

    return () => {
        const index = closeRequestListeners.indexOf(listener);
        if (index === -1) {
            return;
        }
        closeRequestListeners.splice(index, 1);

        if (closeRequestListeners.length === 0) {
            if (hostListenerId) {
                void hostListenerId.then((id) => functions.removeDialogCloseRequestListener?.(id));
                hostListenerId = null;
            }
        }
    };
};

/**
 * @category Hooks
 */
export const useDialogState = (): DialogHookResult => {
    const setResult = useFunctionsSelector((f) => f.setDialogResult);
    const sendData = useFunctionsSelector((f) => f.dispatchEventToDialogHost);
    const addDataListener = useFunctionsSelector((f) => f.addDialogHostEventListener);
    const addDialogCloseRequestListener = useFunctionsSelector((f) => f.addDialogCloseRequestListener);
    const removeDialogCloseRequestListener = useFunctionsSelector((f) => f.removeDialogCloseRequestListener);
    const isClosingRequested = useValuesSelector((v) => v.dialog?.isClosingRequested ?? false);

    const addCloseRequestListener = useMemo(() => createAddCloseRequestListener({
        addDialogCloseRequestListener,
        removeDialogCloseRequestListener,
    }), [addDialogCloseRequestListener, removeDialogCloseRequestListener]);

    return {
        setResult,
        sendData,
        addDataListener,
        isClosingRequested,
        addCloseRequestListener,
    };
};

/**
 * @category Hooks
 */
export const useDialogData = <T extends any>(): T => {
    return useValuesSelector(v => v.dialog?.dialogInput);
};

