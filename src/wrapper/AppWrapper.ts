import {
    AccessToken,
    ChaynsReactFunctions,
    ChaynsReactValues,
    CleanupCallback,
    DataChangeCallback,
    DataChangeValue,
    Environment,
    Font,
    Gender,
    IChaynsReact,
    IconType, RuntimeEnviroment,
} from '../types/IChaynsReact';
import invokeAppCall from "../util/appCall";
import getDeviceInfo from "../util/deviceHelper";
import { removeVisibilityChangeListener } from "../calls/visibilityChangeListener";
import getUserInfo from "../calls/getUserInfo";

export class AppWrapper implements IChaynsReact {

    values: ChaynsReactValues = null!;

    accessToken: string = "";

    mapOldApiToNew({ retVal }) {
        const { AppInfo, AppUser } = retVal;
        this.accessToken = AppUser.TobitAccessToken;
        return {
            device: getDeviceInfo(navigator.userAgent, 'image/webp'),
            environment: {
                buildEnvironment: Environment.Production,
                runtimeEnvironment: RuntimeEnviroment.Unknown
            },
            language: {
                site: AppInfo.Language,
                translation: null,
                device: AppInfo.Language,
                active: AppInfo.Language
            }, // ToDo: Find better way to detect
            site: {
                id: AppInfo.SiteID,
                locationId: AppInfo.LocationID,
                url: window?.location.href.split('#')[0],
                layoutDisposition: {
                    contentWide: false,
                    barOnTop: false,
                    barWide: false,
                    coverDetached: false,
                    coverHidden: false,
                    coverWide: false,
                    docked: false
                },
                title: AppInfo.Title,
                colorMode: AppInfo.colorMode,
                color: AppInfo.color,
                domain: AppInfo.domain,
                font: {
                    id: Font.Roboto,
                    headlineFont: Font.Roboto,
                    dynamicFontSize: false
                },
                dynamicFontSize: false,
                locationPersonId: AppInfo.LocationPersonId,
                urlHash: window?.location.hash.replace('#', '')
            },
            parameters: [...new URLSearchParams(location.search)] as unknown,
            user: {
                firstName: AppUser.FirstName,
                lastName: AppUser.LastName,
                gender: Gender.Unknown,
                userId: AppUser.TobitUserID,
                personId: AppUser.PersonID,
                uacGroups: []
            },
            customData: null,
            isAdminModeActive: AppUser.AdminMode,
            currentPage: {
                id: AppInfo.TappSelected?.TappID,
                siteId: AppInfo.SiteID
            },
            pages: AppInfo.Tapps.map(x => ({
                id: x.TappID,
                icon: '',
                iconType: IconType.Font,
                customUrl: '',
                isExclusive: x.isExclusiveView,
                isHiddenFromMenu: x.isHiddenFromMenu,
                minAge: null,
                name: x.ShowName,
                sortId: x.SortUID
            }))
        } as ChaynsReactValues
    }

    constructor() {
    }

    counter: number = 0;
    appCall(call) {
        // generate uuid just in case multiple AppWrapper in one window
        call.value.callback = `window.chaynsApiV5Callback_` + this.counter++;
        invokeAppCall(call)
    }

    // @ts-ignore
    functions: ChaynsReactFunctions = {
        getAccessToken: async (accessToken?: AccessToken) => {
            return {
                accessToken: this.accessToken
            };
        },
        // addGeoLocationListener: async (value , callback) => {
        //     return invokeAppCall({
        //         'action': 14,
        //         'value': {
        //             'permanent': false,
        //             callback: callback
        //         }
        //     });
        // },
        // addScrollListener: async (value, callback) => {
        //
        // },
     //   addVisibilityChangeListener: async (callback) => addVisibilityChangeListener(callback),
        // addWindowMetricsListener: async (callback) => {
        //     const { id, shouldInitialize } = addApiListener('windowMetricsListener', callback);
        //
        //     if (shouldInitialize) {
        //         window.addEventListener('resize', this.resizeListener = () => {
        //             void (async() => {
        //                 dispatchApiEvent('windowMetricsListener', {
        //
        //                 });
        //             })();
        //         })
        //     }
        //     return id;
        // },
        customCallbackFunction: async (type, data) => {
        },
        // getAvailableSharingServices: async () => {
        // },
        // getGeoLocation: async (value) => {
        // },
        getUserInfo: async (query) => {
            return getUserInfo(this, query);
        },
        // getScrollPosition: async () => {
        // },
        // getWindowMetrics: async () => {
        // },
        invokeCall: async (value, callback) => {
        },
        invokeDialogCall: async (value, callback) => {
            const callbackName = `chaynsApiV5Callback_${this.counter++}`;
            window[callbackName] = ({ retVal }) => {
                callback?.(retVal);
                delete window[callbackName];
            };
            const callObj = { ...value, value: { ...value.value, callback: callbackName }};
            invokeAppCall(callObj);
        },
        // login: async(value, callback, closeCallback) => {
        // },
        logout: async () => {
        },
        navigateBack: async () => {
        },
        openImage: async (value) => {
        },
        openUrl: async (value) => {
        },
        openVideo: async (value) => {
        },
        refreshAccessToken: async () => {
        },
        refreshData: async (value) => {
        },
        removeGeoLocationListener: async (id) => {
        },
        removeScrollListener: async (id) => {
        },
        removeVisibilityChangeListener(number) {
            removeVisibilityChangeListener(number);
            return Promise.resolve();
        },
        removeWindowMetricsListener: async (id) => {
        },
        selectPage: async(options) => {
        },
        scrollToY: async(position, duration) => {
        },
        // sendMessageToGroup: async (groupId, message) => {
        // },
        // sendMessageToPage: async (message) => {
        // },
        // sendMessageToUser: async (userId, message) => {
        // },
        setAdminMode: async (enabled) => {
        },
        // setDisplayTimeout: async (value) => {
        // },
        setFloatingButton: async (value, callback) => {
        },
        setHeight: async (value) => {
        },
        setOverlay: async (value, callback) => {
        },
        setRefreshScrollEnabled: async (isEnabled) => {
            invokeAppCall({
                action: 0,
                value: {
                    enabled: isEnabled
                }
            });
            return { isEnabled };
        },
        // setScanQrCode: async (value) => {
        // },
        setTempDesignSettings: async (value) => {
        },
        setWaitCursor: async (value) => {
        },
        storageGetItem: async (key, accessMode) => {

        },
        storageRemoveItem: async (key, accessMode) => {
        },
        storageSetItem: async (key, value, accessMode, tappIds) => {
        },
        vibrate: async (value) => {
        },
    }

    async init() {
        await new Promise((resolve) => {
            // @ts-ignore
            window.globalDataCallback = (data) => {
                this.values = this.mapOldApiToNew(data);
                resolve(data);
            }
            invokeAppCall({
                action: 18,
                value: {
                    callback: 'window.globalDataCallback'
                }
            })
        })
        return undefined;
    }

    getSSRData() {
        return null;
    }

    addDataListener(cb: DataChangeCallback): CleanupCallback {
        const listener = (ev: CustomEventInit<DataChangeValue>) => ev.detail && cb(ev.detail);
        document.addEventListener('chayns_api_data', listener)
        return () => {document.removeEventListener('chayns_api_data', listener)}
    }

    getInitialData() {
        return this.values;
    }
}
