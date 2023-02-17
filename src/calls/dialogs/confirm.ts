import {buttonText, buttonType, chaynsDialog} from './chaynsDialog';
import { DialogButtonOld } from "../../types/dialog";

type Confirm = {
    headline?: string,
    text?: string,
    buttons?: DialogButtonOld[] | { buttons?: DialogButtonOld[], links?: DialogButtonOld[] },
    links?: unknown,
    select?: unknown
}

export function confirm(title = '', message = '', config: Confirm = {}) {
    // backward compatibility
    if (Array.isArray(config)) {
        config = {
            'buttons': config
        };
    }
    if (!config.buttons || !Array.isArray(config.buttons)) {
        config.buttons = [{
            'text': buttonText.YES,
            'buttonType': buttonType.POSITIVE
        }, {
            'text': buttonText.NO,
            'buttonType': buttonType.NEGATIVE
        }];
    }

    return chaynsDialog({
        'dialog': {
            title,
            message,
            'buttons': config.buttons,
            'links': config.links,
            'select': config.select
        }
    });
}
