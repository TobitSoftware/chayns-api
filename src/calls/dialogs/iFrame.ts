import {buttonText, buttonType, dialogAction} from './chaynsDialog';
import {open} from './open';
import {addDialogDataListener, sendData} from './communication';
import { DialogButtonOld } from "../../types/dialog";
import { getSite, invokeDialogCall } from "../index";

type IFrameDialog = {
    buttons?: DialogButtonOld[],
    url: string,
    input?: object,
    seamless?: boolean,
    transparent?: boolean,
    waitCursor?: boolean,
    maxHeight?: string,
    width?: number,
    fullHeight?: boolean,
    customTransitionTimeout?: number,
}

export function iFrame(dialog: IFrameDialog = {url: ""}) {
    const config = {
        ...dialog,
        tappIframeName: window.name,
        callType: dialogAction.IFRAME,
    };
    if (!config.buttons || !Array.isArray(config.buttons)) {
        config.buttons = [{
            'text': buttonText.YES,
            'buttonType': buttonType.POSITIVE
        }, {
            'text': buttonText.NO,
            'buttonType': buttonType.NEGATIVE
        }];
    }

    const site = getSite();
    config.url = `${config.url}${config.url.indexOf('?') >= 0 ? '&' : '?'}siteId=${site.id}`;
    addDialogDataListener(_chaynsCallResponder, true);
    return open(config);
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
