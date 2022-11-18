import { invokeDialogCall } from "../index";

export function close() {
    return invokeDialogCall({
        action: 113,
        value: {}
    })
}
