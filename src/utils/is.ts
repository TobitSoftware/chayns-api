import { getDevice } from '../calls';
import { AppFlavor } from '../types/IChaynsReact';

export const isApp = () => {
    return getDevice().app?.flavor === AppFlavor.Chayns;
};

export const isAppCallSupported = ({ minAndroidVersion = 1, minIOSVersion = 1 }) => {
    if (!isApp()) return false;
    const device = getDevice();

    if (!device.app?.callVersion || isNaN(device.app.callVersion)) return false;

    if (device.os && ['iOS', 'Mac OS'].includes(device.os)) {
        return device.app.callVersion >= minIOSVersion;
    }

    if (device.os === 'Android OS') {
        return device.app.callVersion >= minAndroidVersion;
    }

    return false;
};

export const isElectron = () => {
    return getDevice().app?.flavor === AppFlavor.Electron;
};
