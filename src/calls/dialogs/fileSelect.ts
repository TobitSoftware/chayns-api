import {buttonText, buttonType, dialogAction} from './chaynsDialog';
import {open} from './open';
import { DialogButton } from "../../types/dialog";
import { getAccessToken, getUser, login } from "../index";

export const fileType = {
    'IMAGE': 'image',
    'VIDEO': 'video',
    'AUDIO': 'audio',
    'DOCUMENT': [
        'application/x-latex',
        'application/x-tex',
        'text/',
        'application/json',
        'application/pdf',
        'application/msword',
        'application/msexcel',
        'application/mspowerpoint',
        'application/vnd.ms-word',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument',
        'application/vnd.oasis.opendocument'
    ]
};

type FileSelectInput = {
    buttons?: DialogButton[],
    callType?: number,
    multiselect?: boolean,
    directory?: boolean,
    chaynsToken?: string
}

export async function fileSelect(dialog: FileSelectInput = {}) {
    if (!dialog.buttons || !Array.isArray(dialog.buttons)) {
        dialog.buttons = [];
        if (dialog.multiselect || dialog.directory) {
            dialog.buttons.push({
                'text': buttonText.OK,
                'buttonType': buttonType.POSITIVE
            });
        }
        dialog.buttons.push({
            'text': buttonText.CANCEL,
            'buttonType': buttonType.NEGATIVE
        });
    }

    dialog.callType = dialogAction.FILE_SELECT;
    const user = getUser();
    if (!user) {
        return login();
    }
    dialog.chaynsToken = (await getAccessToken()).accessToken;
    return open(dialog);
}
