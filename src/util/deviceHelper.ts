import { UAParser } from 'ua-parser-js';
import { AppName, ChaynsApiDevice, ScreenSize } from '../types/IChaynsReact';

const getDeviceInfo = (userAgent: string, acceptHeader: string, { imei }: { imei?: string } = {}) => {
    const uaParser = new UAParser(userAgent);

    let appName: AppName = AppName.Unknown;
    const match = (/(?:my)?chayns\/(?<version>\d+).*(?<siteId>\d{5}-\d{5})/i).exec(userAgent);
    const customMatch = (/\s(?<name>intercom|sidekick|team)\/(?<version>\d+)/i).exec(userAgent);

    if ((/\sintercom\/\d+/i).test(userAgent)) {
        appName = AppName.TobitChat;
    } else if ((/\ssidekick\/\d+/i).test(userAgent)) {
        appName = AppName.Sidekick;
    } else if((/\steam\/\d+/i).test(userAgent)) {
        appName = AppName.Team;
    } else if((/\scityApp\/\d+/i).test(userAgent)) {
        appName = AppName.CityApp;
    } else if (match?.groups?.siteId === '60021-08989') {
        appName = AppName.Chayns;
    } else if (match?.groups?.siteId === '77892-10814') {
        appName = AppName.David;
    } else if (match) {
        appName = AppName.Location;
    } else if ((/dface|h96pp|h96max|jabiru|chaynsterminal|wayter|odroidn2p/i).test(userAgent)) {
        appName = AppName.ChaynsLauncher;
    }

    let appVersion = match?.groups ? Number.parseInt(match.groups.version, 10) : NaN;
    if (customMatch?.groups?.version) {
        appVersion = Number.parseInt(customMatch.groups.version, 10)
    }

    const result = {} as ChaynsApiDevice;
    const browser = uaParser.getBrowser();
    result.browser = {
        name: browser?.name,
        version: browser?.version,
        majorVersion: Number.parseInt(browser?.version?.split('.')[0] ?? '0', 10) || 0,
        isWebPSupported: acceptHeader.includes('image/webp'),
    };
    result.app = {
        name: appName,
        version: match?.groups ? Number.parseInt(match.groups.version, 10) : NaN,
        appVersion,
        callVersion: match?.groups ? Number.parseInt(match.groups.version, 10) : NaN,
    }
    result.imei = imei;
    result.engine = uaParser.getEngine();
    // TODO: breaking change on next minor and use object with name and version
    result.os = uaParser.getOS()?.name === 'Android' ? 'Android OS' : uaParser.getOS()?.name as ChaynsApiDevice["os"];
    result.osVersion = uaParser.getOS()?.version;
    if (typeof window !== 'undefined') {
        result.screenSize = getScreenSize(window.innerWidth);
        result.isTouch = getClientDeviceInfo().isTouch;
    } else {
        // estimate size over user agent, very inaccurate, could be improved by setting a cookie with the screensize
        const screenSizeByUA = /mobi/i.test(userAgent) ? ScreenSize.SM : ScreenSize.XL;
        result.screenSize = appName !== AppName.Unknown ? ScreenSize.XS : screenSizeByUA;
    }

    return result;
}

// Infos that are only available on client or iframe side
export const getClientDeviceInfo = () => ({
        isTouch: navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches
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
