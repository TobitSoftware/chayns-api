import {buttonText, buttonType, dialogAction} from './chaynsDialog';
import {open} from './open';
import { DialogButtonOld } from "../../types/dialog";

type InputDialog = {
    buttons?: DialogButtonOld[],
    callType?: number,
    formatter?: string
}

export function input(dialog: InputDialog = {}) {
    if (!dialog.buttons || !Array.isArray(dialog.buttons)) {
        dialog.buttons = [{
            'text': buttonText.YES,
            'buttonType': buttonType.POSITIVE
        }, {
            'text': buttonText.NO,
            'buttonType': buttonType.NEGATIVE
        }];
    }

    if (dialog.formatter) {
        dialog.formatter = dialog.formatter.toString();
    }

    dialog.callType = dialogAction.INPUT;
    return open(dialog);
}

export const inputType = {
    'DEFAULT': 0,
    'PASSWORD': 1,
    'TEXTAREA': 2,
    'INPUT': 3,
    'NUMBER': 4
};
