import { DialogDataHookResult, DialogHookResult } from '../types/IChaynsReact';
import { ChaynsContext, ChaynsFunctionsContext } from '../components/ChaynsContext';
import { useInternalContextSelector } from "./context";

/**
 * @category Hooks
 */
export const useDialogState = (): DialogHookResult => {
    const setResult = useInternalContextSelector(ChaynsFunctionsContext, v => v?.setDialogResult);
    const sendData = useInternalContextSelector(ChaynsFunctionsContext, v => v?.dispatchEventToDialogHost);
    const addDataListener = useInternalContextSelector(ChaynsFunctionsContext, v => v?.addDialogHostEventListener);
    const isClosingRequested = useInternalContextSelector(ChaynsContext, v => (v?.dialog)?.isClosingRequested!);

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
    return useInternalContextSelector(ChaynsContext, v => (v?.dialog)?.dialogInput);
};

