import {buttonText, buttonType, dialogAction} from './chaynsDialog';
import {open} from './open';
import { DialogButtonOld } from "../../types/dialog";

type SignatureInput = {
    buttons?: DialogButtonOld[],
    callType?: number
}

export function signature(dialog?: SignatureInput) {
    if(!dialog) dialog = { };
    if (!dialog.buttons || !Array.isArray(dialog.buttons)) {
        dialog.buttons = [];
        dialog.buttons.push({
            'text': buttonText.OK,
            'buttonType': buttonType.POSITIVE
        });
        dialog.buttons.push({
            'text': buttonText.CANCEL,
            'buttonType': buttonType.NEGATIVE
        });
    }

    dialog.callType = dialogAction.SIGNATURE;

    return open(dialog);
}
