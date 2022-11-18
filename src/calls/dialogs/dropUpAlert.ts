import {open} from './open';
import {dialogAction} from './chaynsDialog';

type DropUpAlert = {
    callType?: number
}

export function dropUpAlert(dialog: DropUpAlert = {}) {
    dialog.callType = dialogAction.DROP_UP_ALERT;
    return open(dialog);
}
