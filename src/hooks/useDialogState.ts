import { DialogDataHookResult, DialogHookResult, DialogModule } from "../types/IChaynsReact";
import { useContextSelector } from "use-context-selector";
import { ChaynsContext, ChaynsFunctionsContext } from "../components/ChaynsContext";

/**
 * @category Hooks
 */
export const useDialogState = (): DialogHookResult => {
    const closeDialog = useContextSelector(ChaynsFunctionsContext, v => v?.closeDialog);
    const isClosingRequested = useContextSelector(ChaynsContext, v => (v?.dialog as DialogModule)?.isClosingRequested!);

    return {
        closeDialog,
        isClosingRequested
    } as DialogHookResult
}

/**
 * @category Hooks
 */
export const useDialogData = (): DialogDataHookResult => {
    const inputData = useContextSelector(ChaynsContext, v => (v?.dialog as DialogModule).dialogInput!);
    return {
        inputData
    }
}

