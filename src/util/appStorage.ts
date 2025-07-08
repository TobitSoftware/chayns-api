import { addApiListener, dispatchApiEvent } from '../helper/apiListenerHelper';
import { AppWrapper } from '../wrapper/AppWrapper';

export function getAppStorageItem<T extends unknown>(this: AppWrapper, storeName: string, key: string) {
    const callbackName = `chaynsApiV5Callback_${this.counter++}`;

    return new Promise((resolve, reject) => {
        window[callbackName] = (_key: string, _storeName: string, value: T) => {
            resolve(value);
            delete window[callbackName];
        }
        if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
            window.webkit.messageHandlers.chaynsDataGetItem.postMessage({
                storeName,
                key,
                callback: callbackName,
            });
        } else {
            resolve(window.chaynsWebViewStorage.chaynsDataGetItem(storeName, key));
        }
    });
}

export function setAppStorageItem<T extends string | object>(this: AppWrapper, storeName: string, key: string, value: T) {
    const callbackName = `chaynsApiV5Callback_${this.counter++}`;

    return new Promise<void>((resolve, reject) => {
        window[callbackName] = () => {
            resolve();
            delete window[callbackName];
        }
        if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
            window.webkit.messageHandlers.chaynsDataSetItem.postMessage({
                storeName,
                key,
                value,
            })
        } else {
            window.chaynsWebViewStorage.chaynsDataGetItem(storeName, key, JSON.stringify(value));
        }
    })
}

export function addAppStorageListener<T extends string | object>(this: AppWrapper, storeName: string, callback: (value: { key?: string; value?: T, action: number }) => void) {
    const callbackName = `chaynsApiV5Callback_${this.counter++}`;

    const { id, shouldInitialize } = addApiListener(`appStorageListener/${storeName}`, callback);

    if (shouldInitialize) {
        window[callbackName] = (value: { key?: string; value?: T; action: number }) => {
            dispatchApiEvent(`appStorageListener/${storeName}`, value);
        }

        this.appCall({
            action: 307,
            value: {
                storeName,
                callback: callbackName,
                action: 1,
            }
        })
    }

    return id;
}
