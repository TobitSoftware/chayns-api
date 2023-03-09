import { DialogDataHookResult, DialogHookResult } from '../types/IChaynsReact';
import { useContextSelector } from 'use-context-selector';
import { ChaynsContext, ChaynsFunctionsContext } from '../components/ChaynsContext';

/**
 * @category Hooks
 */
export const useDialogState = (): DialogHookResult => {
    const setResult = useContextSelector(ChaynsFunctionsContext, v => v?.setDialogResult);
    const sendData = useContextSelector(ChaynsFunctionsContext, v => v?.dispatchEventToDialogHost);
    const addDataListener = useContextSelector(ChaynsFunctionsContext, v => v?.addDialogHostEventListener);
    const isClosingRequested = useContextSelector(ChaynsContext, v => (v?.dialog)?.isClosingRequested!);

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
    const inputData = useContextSelector(ChaynsContext, v => (v?.dialog)?.dialogInput);
    return inputData;
};

