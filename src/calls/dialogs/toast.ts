import { getCallbackName } from "./utils/callback";
import { invokeDialogCall } from "../index";

export function toast(config = {}) {
    const callbackName = 'toastCallback';

    return invokeDialogCall({
        action: 276,
        value: {
            'callback': getCallbackName(callbackName),
            ...config
        }
    });
}
