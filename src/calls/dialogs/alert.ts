import {buttonText, buttonType, chaynsDialog} from './chaynsDialog';

/** @deprecated Use createDialog with type DialogType.ALERT instead */
export function alert(title = '', message = '') {
    return chaynsDialog({
        'dialog': {
            title,
            message,
            'buttons': [{
                'text': buttonText.OK,
                'buttonType': buttonType.POSITIVE
            }]
        }
    });
}
