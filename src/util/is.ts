import { getDevice } from '../calls';
import { AppName } from '../types/IChaynsReact';

export const isApp = () => {
    return (getDevice().app?.name ?? AppName.Unknown) !== AppName.Unknown;
}

export const isAppCallSupported = ({ minAndroidVersion = 1, minIOSVersion = 1 }) => {
    if (!isApp()) return false;
    const device = getDevice();

    if (!device.app?.callVersion || isNaN(device.app.callVersion)) return false;

    if (device.os && ['iOS', 'Mac OS'].includes(device.os)) {
        return device.app.callVersion >= minIOSVersion;
    }

    if (device.os === 'Android') {
        return device.app.callVersion >= minAndroidVersion;
    }

    return false;
}
