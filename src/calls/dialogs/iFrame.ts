import {buttonText, buttonType, dialogAction} from './chaynsDialog';
import {open} from './open';
import {addDialogDataListener, sendData} from './communication';
import { DialogButtonOld } from "../../types/dialog";
import { getSite, invokeDialogCall } from "../index";

type iFrameDialog = {
    buttons?: DialogButtonOld[],
    callType?: number,
    tappIframeName?: string,
    url: string
}

export function iFrame(dialog: iFrameDialog = {url: ""}) {
    if (!dialog.buttons || !Array.isArray(dialog.buttons)) {
        dialog.buttons = [{
            'text': buttonText.YES,
            'buttonType': buttonType.POSITIVE
        }, {
            'text': buttonText.NO,
            'buttonType': buttonType.NEGATIVE
        }];
    }

    dialog.tappIframeName = window.name;
    dialog.callType = dialogAction.IFRAME;
    const site = getSite();
    dialog.url = `${dialog.url}${dialog.url.indexOf('?') >= 0 ? '&' : '?'}siteId=${site.id}`;
    addDialogDataListener(_chaynsCallResponder, true);
    return open(dialog);
}

export function _chaynsCallResponder(obj) {
    if (obj.call.value.callback) {
        const call = JSON.parse(JSON.stringify(obj)); // deep copy
        invokeDialogCall(obj).then((result) => {
            sendData({result, call}, true);
        });
    } else {
        invokeDialogCall(obj);
    }
}
