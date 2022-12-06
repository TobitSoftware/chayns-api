/* eslint-disable */
// @ts-nocheck

import {
    AvailableSharingServices,
    ChaynsReactFunctions,
    ChaynsReactValues,
    CleanupCallback,
    DataChangeCallback,
    DataChangeValue,
    Environment,
    Font,
    Gender,
    GeoLocation,
    IChaynsReact,
    IconType,
    RuntimeEnviroment,
    ScanQrCodeResult,
    TappEvent,
    VisibilityChangeListenerResult,
} from '../types/IChaynsReact';
import invokeAppCall from "../util/appCall";
import getDeviceInfo, { getScreenSize } from "../util/deviceHelper";
import { removeVisibilityChangeListener } from "../calls/visibilityChangeListener";
import getUserInfo from "../calls/getUserInfo";
import { sendMessageToGroup, sendMessageToPage, sendMessageToUser } from "../calls/sendMessage";
import { addApiListener, dispatchApiEvent } from "../helper/apiListenerHelper";

export class AppWrapper implements IChaynsReact {

    values: ChaynsReactValues = null!;

    accessToken = "";

    mapOldApiToNew(retVal) {
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

    notImplemented(call: string) {
        console.warn(`call ${call} not implement in app`)
    }

    counter: number = 0;

    appCall(action, value: unknown = {}, { callback, awaitResult = true } = { }) {
        if(!awaitResult) {
            invokeAppCall({ action, value });
            return;
        }
        return new Promise((resolve) => {
            const callbackName = `chaynsApiV5Callback_${this.counter++}`;
            window[callbackName] = (v) => {
                if(callback) {
                    callback(v?.retVal ?? v);
                } else {
                    delete window[callbackName];
                }
                resolve(v?.retVal ?? v);
            }
            value.callback = "window." + callbackName;
            invokeAppCall({ action, value });
        })
    }

    functions: ChaynsReactFunctions = {
        getAccessToken: async () => ({
                accessToken: this.accessToken
            }),
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
       addVisibilityChangeListener: async (callback) => {
           const { id, shouldInitialize } = addApiListener('windowMetricsListener', callback);
            this.appCall(60, {}, { callback: (v) => {
                console.log("v", v)
                dispatchApiEvent("windowMetricsListener", {
                    isVisible: v.tappEvent === TappEvent.OnShow,
                    tappEvent: v.tappEvent
                });
            }})
           return id;
       },
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
        customCallbackFunction: async () => {
            this.notImplemented("customCallbackFunction");
        },
        getAvailableSharingServices: async () => {
            const res = await this.appCall(79) as AvailableSharingServices;
            return {
                availableSharingApps: res.availableSharingApps,
                availableAndroidApps: res.availableAndroidApps as string []
            }
        },
        getGeoLocation: async () => {
            const res = await this.appCall(14) as GeoLocation;
            return {
                latitude: res.latitude,
                longitude: res.longitude,
                speed: res.speed,
                code: res.code,
                isAccurate: res.isAccurate
            }
        },
        getUserInfo: async (query) => {
            return getUserInfo(this, query);
        },
        getScrollPosition: async () => {
            return {
                scrollX: window.scrollX,
                scrollY: window.scrollY
            }
        },
        getWindowMetrics: async () => ({
                bottomBarHeight: 0,
                windowHeight: window.innerHeight,
                offsetTop: 0,
                pageHeight: window.innerHeight,
                pageSize: getScreenSize(window.innerWidth),
                pageWidth: window.innerWidth,
                topBarHeight: 0
            }),
        invokeCall: async (value, callback) => {
            return this.appCall(value.action, value.value, {callback});
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
        login: async(value, callback, closeCallback) => {
            const res = await this.appCall({}, callback);
            return { loginState: res?.loginState }
        },
        logout: async () => {
            this.appCall(56, undefined, {
                awaitResult: false
            });
        },
        navigateBack: async () => {
            this.appCall(20, undefined, {
                awaitResult: false
            });
        },
        openImage: async (value) => {
            this.appCall(4, {
                items: value.items.map(x => ({
                    url: x.url,
                    title: x.title,
                    description: x.description,
                    preventCache: x.preventCache,
                })),
                startIndex: value.startIndex
            }, {
                awaitResult: false
            })
        },
        // openUrl: async (value) => {
        //
        // },
        openVideo: async (value) => {
            this.appCall(15, {
                url: value.url
            }, {
                awaitResult: false
            })
        },
        refreshAccessToken: async () => {
            this.appCall(55, undefined, {
                awaitResult: false
            });
        },
        refreshData: async (value) => {
            this.notImplemented("refreshData");
        },
        // removeGeoLocationListener: async (id) => {
        // },
        // removeScrollListener: async (id) => {
        // },
        removeVisibilityChangeListener(number) {
            removeVisibilityChangeListener(number);
            return Promise.resolve();
        },
        // removeWindowMetricsListener: async (id) => {
        //
        // },
        selectPage: async(options) => {
            void this.appCall(2, {
                id: options.id,
                showName: options.showName,
                position: options.position,
                params: options.params
            }, {
                awaitResult: false
            })
        },
        scrollToY: async(position) => {
            window.scrollTo({
                top: position
            })
        },
        sendMessageToGroup: async (groupId, message) => {
            return sendMessageToGroup(this, message, groupId);
        },
        sendMessageToPage: async (message) => {
            return sendMessageToPage(this, message);
        },
        sendMessageToUser: async (userId, message) => {
            return sendMessageToUser(this, message, userId);
        },
        setAdminMode: async () => {
            this.notImplemented("setAdminMode");
        },
        setDisplayTimeout: async (enabled) => {
            this.appCall(94, { enabled }, {awaitResult: false});
            return {
                isEnabled: enabled
            }
        },
        setFloatingButton: async (value, callback) => {
            void await this.appCall(72, {
                text: value.text,
                textSize: value.textSize,
                badge: value.badge,
                color: value.color,
                colorText: value.colorText,
                icon: value.icon,
                enabled: value.isEnabled,
                position: value.position,
            }, callback);
        },
        setHeight: async () => {
            this.notImplemented("setOverlay");
        },
        setOverlay: async () => {
            this.notImplemented("setOverlay");
        },
        setRefreshScrollEnabled: async (isEnabled) => {
            this.appCall(0, {
                enabled: isEnabled
            }, {awaitResult: false});
            return {
                isEnabled
            }
        },
        setScanQrCode: async (value) => {
            return await this.appCall(34, value) as Promise<ScanQrCodeResult>;
        },
        setTempDesignSettings: async () => {
            this.notImplemented("setTempDesignSettings");
        },
        setWaitCursor: async (value) => {
            void this.appCall(1, {
                enabled: value.isEnabled,
                text: value.text,
                timeout: value.timeout,
                progress: value.progress,
                progressText: value.progressText,
                disappearTimeout: value.disappearTimeout
            }, {
                awaitResult: false
            })
        },
        storageGetItem: async (key, accessMode) => {
            const result = await this.appCall(74, {
                key,
                accessMode
            });
            return result?.object;
        },
        storageRemoveItem: async (key, accessMode) => {
            this.appCall(73, {
                key,
                accessMode
            }, { awaitResult: false });
        },
        storageSetItem: async (key, value, accessMode, tappIds) => {
            this.appCall(73, {
                key,
                object: value as unknown,
                accessMode,
                tappIDs: tappIds
            }, {
                awaitResult: false
            });
        },
        vibrate: async (value) => {
            void this.appCall(19, value, { awaitResult: false });
        },
    }

    async init() {
        this.values = this.mapOldApiToNew(await this.appCall(18));
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
