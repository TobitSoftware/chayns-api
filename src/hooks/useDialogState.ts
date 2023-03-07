import { DialogDataHookResult, DialogHookResult } from '../types/IChaynsReact';
import { useContextSelector } from 'use-context-selector';
import { ChaynsContext, ChaynsFunctionsContext } from '../components/ChaynsContext';

/**
 * @category Hooks
 */
export const useDialogState = (): Pick<DialogHookResult, 'closeDialog' | 'isClosingRequested'> => {
    const closeDialog = useContextSelector(ChaynsFunctionsContext, v => v?.closeDialog);
    const isClosingRequested = useContextSelector(ChaynsContext, v => (v?.dialog)?.isClosingRequested!);

    return {
        closeDialog,
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

