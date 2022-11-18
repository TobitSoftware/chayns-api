import {buttonText, buttonType, dialogAction} from './chaynsDialog';
import {open} from './open';
import { DialogButton } from "../../types/dialog";
import { getAccessToken, getUser, login } from "../index";

type MediaSelectInput = {
    buttons?: DialogButton[],
    callType?: number,
    chaynsToken?: string
}

export async function mediaSelect(dialog: MediaSelectInput = {}) {
    if (!dialog.buttons || !Array.isArray(dialog.buttons)) {
        dialog.buttons = [{
            'text': buttonText.OK,
            'buttonType': buttonType.POSITIVE
        }, {
            'text': buttonText.CANCEL,
            'buttonType': buttonType.NEGATIVE
        }];
    }

    dialog.callType = dialogAction.MEDIA_SELECT;
    const user = getUser();
    if (!user) {
        return login();
    }
    dialog.chaynsToken = (await getAccessToken()).accessToken;
    return open(dialog);
}
