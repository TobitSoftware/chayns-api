import { invokeDialogCall } from "../index";

export function open(json) {
    return new Promise((resolve, reject) => {
        invokeDialogCall({
            action: 184,
            value: {
                'dialogContent': json
            }
        }, (e) => {
            resolve(e);
        })
    });
}

