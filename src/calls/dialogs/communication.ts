// @ts-nocheck

import { invokeDialogCall } from "../index";

export function sendData(data, isApiEvent) {
    return invokeDialogCall({
        action: 218,
        value: {
            data,
            isApiEvent
        }
    });
}

const listeners = [];
const apiListeners = [];

function _dialogDataListener(e = {}) {
    if (!e.data || (!e.data.action && typeof e.data !== 'string')) {
        return;
    }

    const messageObj = e.data.action ? e.data : JSON.parse(e.data.match(/(\{(?:.*)\})/)[0]);
    if (messageObj.action === 218) {
        const {data} = messageObj.value;
        if (messageObj.value.isApiEvent) {
            apiListeners.forEach((listener) => {
                listener(data);
            });
        } else {
            listeners.forEach((listener) => {
                listener(data);
            });
        }
    }
}

export function addDialogDataListener(callback, getApiEvents = false) {
    if (listeners.length === 0 || apiListeners.length === 0) {
        window.addEventListener('message', _dialogDataListener);
    }
    if (getApiEvents) {
        apiListeners.push(callback);
    } else {
        listeners.push(callback);
    }
    return true;
}

export function removeDialogDataListener(callback, getApiEvents = false) {
    let index;
    if (getApiEvents) {
        index = apiListeners.indexOf(callback);
        if (index !== -1) {
            apiListeners.splice(index, 1);
        }
    } else {
        index = listeners.indexOf(callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }
    if (listeners.length === 0 && apiListeners.length === 0) {
        window.removeEventListener('message', _dialogDataListener);
    }
    return index !== -1;
}
