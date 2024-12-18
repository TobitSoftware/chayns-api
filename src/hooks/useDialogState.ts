import { DialogDataHookResult, DialogHookResult } from '../types/IChaynsReact';
import { useFunctionsSelector, useValuesSelector } from './context';

/**
 * @category Hooks
 */
export const useDialogState = (): DialogHookResult => {
    const setResult = useFunctionsSelector((f) => f.setDialogResult);
    const sendData = useFunctionsSelector((f) => f.dispatchEventToDialogHost);
    const addDataListener = useFunctionsSelector((f) => f.addDialogHostEventListener);
    const isClosingRequested = useValuesSelector((v) => v.dialog?.isClosingRequested ?? false);

    return {
        setResult,
        sendData,
        addDataListener,
        isClosingRequested,
    };
};

/**
 * @category Hooks
 */
export const useDialogData = (): DialogDataHookResult => {
    return useValuesSelector(v => v.dialog?.dialogInput);
};

