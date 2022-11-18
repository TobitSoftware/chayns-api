import {open} from './open';
import { getCallbackName } from './utils/callback';

export const buttonText = {
    'YES': {
        'de': 'Ja',
        'en': 'Yes',
        'nl': 'Ja'
    }['de'] || 'Yes', // TODO: Language
    'NO': {
        'de': 'Nein',
        'en': 'No',
        'nl': 'Nee'
    }['de'] || 'No',
    'OK': 'OK',
    'CANCEL': {
        'de': 'Abbrechen',
        'en': 'Cancel',
        'nl': 'Annuleren'
    }['de'] || 'Cancel'
};

export const buttonType = {
    'CANCEL': -1,
    'NEGATIVE': 0,
    'POSITIVE': 1
};

export const dialogAction = {
    'ALERT_CONFIRM': 178,
    'INPUT': 173,
    'SELECT': 174,
    'DATE': 175,
    'ADVANCED_DATE': 176,
    'DROP_UP_ALERT': 177,
    'MEDIA_SELECT': 179,
    'FILE_SELECT': 180,
    'SIGNATURE': 181,
    'IFRAME': 191
};

export function chaynsDialog(config) {
    const callbackName = 'chaynsDialog';

    config.callback = getCallbackName(callbackName);

    if (config.dialog) {
        config.dialog.callType = dialogAction.ALERT_CONFIRM;
        // @ts-ignore
        return open(config.dialog).then((data) => Promise.resolve(data.selection ? data : data.buttonType));
    }
    return "unsupported";
}
