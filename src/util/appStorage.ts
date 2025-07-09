import { addApiListener } from '../helper/apiListenerHelper';
import { AppWrapper } from '../wrapper/AppWrapper';

export function getAppStorageItem<T extends unknown>(this: AppWrapper, storeName: string, key?: string) {
    const callbackName = `chaynsApiV5Callback_${this.counter++}`;
    return new Promise((resolve) => {
        window[callbackName] = (_key: string, _storeName: string, value: T) => {
            resolve(value);
            delete window[callbackName];
        };
        if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
            window.webkit.messageHandlers.chaynsDataGetItem.postMessage({
                storeName,
                key,
                callback: callbackName,
            });
        } else {
            const result = window.chaynsWebViewStorage.chaynsDataGetItem(storeName, key);
            try {
                resolve(result ? JSON.parse(result) : result);
            } catch {
                resolve(result);
            }
        }
    });
}

export function setAppStorageItem<T extends string | object>(this: AppWrapper, storeName: string, key: string, value: T) {
    const callbackName = `chaynsApiV5Callback_${this.counter++}`;
    return new Promise<void>((resolve, reject) => {
        window[callbackName] = () => {
            resolve();
            delete window[callbackName];
        };
        if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
            window.webkit.messageHandlers.chaynsDataSetItem.postMessage({
                storeName,
                key,
                value,
            });
        } else {
            window.chaynsWebViewStorage.chaynsDataSetItem(storeName, key, JSON.stringify(value));
        }
    });
}

export function removeAppStorageItem(this: AppWrapper, storeName: string, key: string) {
    if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
        window.webkit.messageHandlers.chaynsDataRemoveItem.postMessage({
            storeName,
            key,
        });
    } else {
        window.chaynsWebViewStorage.chaynsDataRemoveItem(storeName, key);
    }
}

export function clearAppStorage(this: AppWrapper, storeName: string) {
    if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
        window.webkit.messageHandlers.chaynsDataErase.postMessage({
            storeName,
        });
    } else {
        window.chaynsWebViewStorage.chaynsDataErase(storeName);
    }
}

export async function addAppStorageListener<T extends string | object>(this: AppWrapper, storeName: string, prefix: string, callback: (value: {
    key?: string;
    value?: T,
    action: number
}) => void) {
    const callbackName = `chaynsApiV5Callback_${this.counter++}`;

    const { shouldInitialize } = addApiListener(`appStorageListener/${storeName}`, callback);

    const handleValue = (value: { key?: string; value?: T, action: number }) => {
        if (value.action === 0 && value.key?.startsWith(prefix)) {
            callback(value);
            void removeAppStorageItem.call(this, storeName, value.key);
        }
    };

    if (shouldInitialize) {
        const result = await getAppStorageItem.call(this, storeName) as { key: string; value: T, action: number }[];

        result?.forEach((value) => {
            handleValue(value);
        });
    }

    window[callbackName] = handleValue;

    this.appCall(307, {
            storeName,
            callback: callbackName,
            action: 1,
        }, { awaitResult: false },
    );
}
