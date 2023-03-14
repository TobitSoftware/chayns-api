import { parseUserAgent } from 'detect-browser';
import { AppName, ChaynsApiDevice, ScreenSize } from '../types/IChaynsReact';

const getDeviceInfo = (userAgent: string, acceptHeader: string) => {
    const parsedUA = parseUserAgent(userAgent);

    let appName: AppName = AppName.Unknown;
    const match = (/(?:my)?chayns\/(?<version>\d+).*(?<siteId>\d{5}-\d{5})/i).exec(userAgent);
    if (match?.groups?.siteId === '60021-08989') {
        appName = AppName.Chayns;
    } else if (match?.groups?.siteId === '77892-10814') {
        appName = AppName.David;
    } else if (match) {
        appName = AppName.Location;
    } else if ((/dface|h96pp|h96max|jabiru|chaynsterminal|wayter|odroidn2p/i).test(userAgent)) {
        appName = AppName.ChaynsLauncher;
    }

    const result = {} as ChaynsApiDevice;
    result.browser = {
        name: parsedUA?.name,
        version: parsedUA?.version,
        majorVersion: Number.parseInt(parsedUA?.version?.split('.')[0] ?? '0', 10) || 0,
        isWebPSupported: acceptHeader.includes('image/webp'),
    };
    result.app = {
        name: appName,
        version: match?.groups ? Number.parseInt(match.groups.version, 10) : NaN,
    }
    result.imei = undefined; // TODO
    result.accessToken = undefined; // TODO
    result.os = parsedUA?.os;
    if (typeof window !== 'undefined') {
        result.screenSize = getScreenSize(window.innerWidth);
    } else {
        // estimate size over user agent, very inaccurate, could be improved by setting a cookie with the screensize
        const screenSizeByUA = /mobi/i.test(userAgent) ? ScreenSize.SM : ScreenSize.XL;
        result.screenSize = appName !== AppName.Unknown ? ScreenSize.XS : screenSizeByUA;
    }

    return result;
}

// Infos that are only available on client or iframe side
export const getClientDeviceInfo = () => ({
        isTouch: navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)')
    })

export const getScreenSize = (width): ScreenSize => {
    let value: ScreenSize;
    if(width > 1200) {
        value = ScreenSize.XL;
    } else if(width > 993) {
        value = ScreenSize.LG;
    } else if(width > 769) {
        value = ScreenSize.MD;
    } else if(width > 556) {
        value = ScreenSize.SM;
    } else {
        value = ScreenSize.XS;
    }
    return value;
}

export default getDeviceInfo;
