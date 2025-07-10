import { addApiListener } from '../helper/apiListenerHelper';
import { AppName } from '../types/IChaynsReact';
import { AppWrapper } from '../wrapper/AppWrapper';

export function isAppStorageAvailable(this: AppWrapper) {
    if (this.values.device.app?.name !== AppName.Team) {
        return false;
    }
    return this.values.device.app?.appVersion >= (['iOS', 'Mac OS'].includes(this.values.device.os as string) ? 1046 : 1031)
}

export function getAppStorageItem<T extends unknown>(this: AppWrapper, storeName: string, key?: string) {
    if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
        const callbackName = `chaynsApiV5Callback_${this.counter++}`;

        return new Promise<T>((resolve) => {
            window[callbackName] = (_key: string, _storeName: string, value: T) => {
                resolve(value);
                delete window[callbackName];
            };
            (window as any).webkit.messageHandlers.chaynsDataGetItem.postMessage({
                storeName,
                key,
                callback: callbackName,
            });
        });
    }
    const result = (window as any).chaynsWebViewStorage.chaynsDataGetItem(storeName, key);
    try {
        return result ? JSON.parse(result) : result;
    } catch {
        return result;
    }
}

export function setAppStorageItem<T extends string | object>(this: AppWrapper, storeName: string, key: string, value: T) {
    if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
        const callbackName = `chaynsApiV5Callback_${this.counter++}`;

        return new Promise<void>((resolve, reject) => {
            window[callbackName] = () => {
                resolve();
                delete window[callbackName];
            };
            (window as any).webkit.messageHandlers.chaynsDataSetItem.postMessage({
                storeName,
                key,
                value,
                callback: callbackName,
            });
        });
    }
    (window as any).chaynsWebViewStorage.chaynsDataSetItem(storeName, key, JSON.stringify(value));
}

export function removeAppStorageItem(this: AppWrapper, storeName: string, key: string) {
    if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
        (window as any).webkit.messageHandlers.chaynsDataRemoveItem.postMessage({
            storeName,
            key,
        });
    } else {
        (window as any).chaynsWebViewStorage.chaynsDataRemoveItem(storeName, key);
    }
}

export function clearAppStorage(this: AppWrapper, storeName: string) {
    if (this.values.device.os === 'iOS' || this.values.device.os === 'Mac OS') {
        (window as any).webkit.messageHandlers.chaynsDataErase.postMessage({
            storeName,
        });
    } else {
        (window as any).chaynsWebViewStorage.chaynsDataErase(storeName);
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
