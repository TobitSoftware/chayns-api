import {open} from './open';
import {dialogAction} from './chaynsDialog';

type DropUpAlert = {
    callType?: number
}

/** @deprecated This dialog type has been removed */
export function dropUpAlert(dialog: DropUpAlert = {}) {
    dialog.callType = dialogAction.DROP_UP_ALERT;
    return open(dialog);
}
