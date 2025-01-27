/* eslint-disable */
// @ts-nocheck

import throttle from 'lodash.throttle';
import DialogHandler from '../handler/DialogHandler';
import {
    AvailableSharingServices,
    ChaynsReactFunctions,
    ChaynsReactValues,
    ChaynsSiteSettings,
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
} from '../types/IChaynsReact';
import invokeAppCall from '../util/appCall';
import getDeviceInfo, { getScreenSize } from '../util/deviceHelper';
import getUserInfo from '../calls/getUserInfo';
import { sendMessageToGroup, sendMessageToPage, sendMessageToUser } from '../calls/sendMessage';
import { addApiListener, dispatchApiEvent, removeApiListener } from '../helper/apiListenerHelper';
import { DeviceLanguage } from '../constants/languages';
import { isAppCallSupported } from '../util/is';

let appWrapperDialogId = 0;

export class AppWrapper implements IChaynsReact {

    values: ChaynsReactValues = null!;

    accessToken = '';

    listeners: (() => void)[] =  [];

    customFunctions = {};

    async loadSiteSettings(siteId: string) {
        try {
            const res = await fetch(`https://style.tobit.cloud/css/${siteId}/components`, {
                signal: AbortSignal.timeout?.(5000),
            });

            if (res.status === 200) {
                return await res.json() as ChaynsSiteSettings;
            }

            console.error(`[chayns-api] failed to load site settings with status code: ${res.status}`);
        } catch (ex) {
            console.error('[chayns-api] failed to load site settings', ex);
        }
        return undefined;
    }

    mapOldApiToNew(retVal) {
        const { AppInfo, AppUser, Device } = retVal;
        this.accessToken = AppUser.TobitAccessToken;
        const urlParams = new URLSearchParams(location.search);
        const urlParamsLowerCase = new URLSearchParams(location.search.toLowerCase());
        let tappId = urlParamsLowerCase.get('tappid');
        let colorMode = urlParamsLowerCase.get('colormode');
        let color = AppInfo.color;
        if (colorMode) {
            try {
                colorMode = Number.parseInt(colorMode, 10);
            } catch {

            }
        }
        if (tappId) {
            try {
                tappId = Number.parseInt(tappId, 10);
            } catch {
                // ignore
            }
        }

        let language = AppInfo.Language;

        if (!language) {
            language = DeviceLanguage[Number.parseInt(Device?.LanguageID, 10)] || 'de';
        }

        if (!color && urlParamsLowerCase.has('color')) {
            color = urlParamsLowerCase.get('color');
            if (!color.startsWith('#')) {
                color = `#${color}`;
            }
        }
        let userId = AppUser.TobitUserID;

        if (typeof userId === 'string') {
            try {
                userId = Number.parseInt(userId, 10);
            } catch {
                // ignore
            }
        }

        return {
            device: getDeviceInfo(navigator.userAgent, 'image/webp', { imei: Device.IMEI }),
            environment: {
                buildEnvironment: Environment.Production,
                runtimeEnvironment: RuntimeEnviroment.Unknown,
            },
            language: {
                site: language,
                translation: null,
                device: language,
                active: language,
            },
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
                    docked: false,
                },
                title: AppInfo.Title,
                colorMode: colorMode ?? AppInfo.colorMode,
                color,
                domain: AppInfo.domain,
                font: {
                    id: Font.Roboto,
                    headlineFont: Font.Roboto,
                    dynamicFontSize: false,
                },
                dynamicFontSize: false,
                locationPersonId: AppInfo.LocationPersonId,
                urlHash: window?.location.hash.replace('#', ''),
            },
            parameters: Object.fromEntries(urlParams),
            user: {
                firstName: AppUser.FirstName,
                lastName: AppUser.LastName,
                gender: Gender.Unknown,
                userId: userId,
                personId: AppUser.PersonID,
                uacGroups: [],
            },
            customData: null,
            isAdminModeActive: AppUser.AdminMode,
            currentPage: {
                id: tappId || AppInfo.TappSelected?.TappID,
                siteId: AppInfo.SiteID,
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
                sortId: x.SortUID,
            })),
        } as ChaynsReactValues;
    }

    constructor() {
    }

    notImplemented(call: string) {
        console.warn(`call ${call} not implement in app`);
    }

    counter: number = 0;

    appCall(action, value: unknown = {}, { callback, awaitResult = true } = {}) {
        if (!awaitResult) {
            invokeAppCall({ action, value });
            return;
        }
        return new Promise((resolve) => {
            const callbackName = `chaynsApiV5Callback_${this.counter++}`;
            window[callbackName] = (v) => {
                if (callback) {
                    callback(v?.retVal ?? v);
                } else {
                    delete window[callbackName];
                }
                resolve(v?.retVal ?? v);
            };
            value.callback = 'window.' + callbackName;
            invokeAppCall({ action, value });
        });
    }

    functions: ChaynsReactFunctions = {
        getAccessToken: async () => ({
            accessToken: this.accessToken,
        }),
        addGeoLocationListener: async (value, callback) => {
            const { id, shouldInitialize } = addApiListener('geoLocationListener', callback);

            if (shouldInitialize) {
                this.appCall(14, { permanent: true }, {
                    callback: (v) => {
                        dispatchApiEvent('geoLocationListener', {
                            latitude: v.latitude,
                            longitude: v.longitude,
                            accuracy: v.accuracy ?? null,
                            speed: v.speed,
                            isAccurate: v.isAccurate ?? null,
                            code: v.code ?? null,
                        });
                    },
                });
            }

            return id;
        },
        addScrollListener: async (value, callback) => {
            let throttledCallback = callback;
            if (value.throttle) {
                throttledCallback = throttle(callback, value.throttle);
            }
            const { id, shouldInitialize } = addApiListener('scrollListener', throttledCallback);

            if (shouldInitialize) {
                window.addEventListener('scroll', this.scrollListener = () => {
                    void (async () => {
                        dispatchApiEvent('scrollListener', { scrollX: window.scrollX, scrollY: window.scrollY });
                    })();
                });
            }

            return id;
        },
        addVisibilityChangeListener: async (callback) => {
            const { id, shouldInitialize } = addApiListener('visibilityChangeListener', callback);

            if (shouldInitialize) {
                this.appCall(60, {}, {
                    callback: (v) => {
                        dispatchApiEvent('visibilityChangeListener', {
                            isVisible: v.tappEvent === TappEvent.OnShow,
                            tappEvent: v.tappEvent,
                        });
                    },
                });
            }
            return id;
        },
        addToolbarChangeListener: async (callback) => {
            const { id, shouldInitialize } = addApiListener('toolbarChangeListener', callback);

            if (shouldInitialize) {
                this.appCall(293, {}, {
                    callback: (v) => {
                        dispatchApiEvent('toolbarChangeListener', {
                            isVisible: v.isVisible,
                            toolbarHeight: v.toolbarHeight,
                        });
                    },
                });
            }
            return id;
        },
        addWindowMetricsListener: async (callback) => {
            const { id, shouldInitialize } = addApiListener('windowMetricsListener', callback);

            if (shouldInitialize) {
                window.addEventListener('resize', this.resizeListener = () => {
                    void (async () => {
                        dispatchApiEvent('windowMetricsListener', await this.functions.getWindowMetrics());
                    })();
                });
            }
            return id;
        },
        customCallbackFunction: async () => {
            this.notImplemented('customCallbackFunction');
        },
        getAvailableSharingServices: async () => {
            const res = await this.appCall(79) as AvailableSharingServices;
            return {
                availableSharingApps: res.availableSharingApps,
                availableAndroidApps: res.availableAndroidApps as string [],
            };
        },
        getGeoLocation: async () => {
            const res = await this.appCall(14) as GeoLocation;
            return {
                latitude: res.latitude,
                longitude: res.longitude,
                speed: res.speed,
                accuracy: res.accuracy ?? null,
                isAccurate: res.isAccurate ?? null,
                code: res.code ?? null,
            };
        },
        getUserInfo: async (query) => {
            return getUserInfo(this, query);
        },
        getScrollPosition: async () => {
            return {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
            };
        },
        getWindowMetrics: async () => ({
            bottomBarHeight: 0,
            windowHeight: window.innerHeight,
            offsetTop: 0,
            pageHeight: window.innerHeight,
            pageSize: getScreenSize(window.innerWidth),
            pageWidth: window.innerWidth,
            topBarHeight: 0,
        }),
        invokeCall: async (value, callback) => {
            return this.appCall(value.action, value.value, { callback });
        },
        invokeDialogCall: async (value, callback) => {
            const callbackName = `chaynsApiV5Callback_${this.counter++}`;
            window[callbackName] = ({ retVal }) => {
                callback?.(retVal);
                delete window[callbackName];
            };
            const callObj = { ...value, value: { ...value.value, callback: callbackName } };
            invokeAppCall(callObj);
        },
        login: async (value, callback, closeCallback) => {
            const res = await this.appCall(54, value);
            return { loginState: res?.loginState };
        },
        logout: async () => {
            this.appCall(56, undefined, {
                awaitResult: false,
            });
        },
        navigateBack: async () => {
            this.appCall(20, undefined, {
                awaitResult: false,
            });
        },
        openImage: async (value) => {
            this.appCall(4, {
                urls: value.items.map(x => x.url),
                items: value.items.map(x => ({
                    url: x.url,
                    title: x.title,
                    description: x.description,
                    preventCache: x.preventCache,
                })),
                startIndex: value.startIndex,
            }, {
                awaitResult: false,
            });
        },
        openUrl: async (value) => {
            window.open(value.url);
        },
        openVideo: async (value) => {
            this.appCall(15, {
                url: value.url,
            }, {
                awaitResult: false,
            });
        },
        refreshAccessToken: async () => {
            this.appCall(55, undefined, {
                awaitResult: false,
            });
        },
        refreshData: async (value) => {
            this.notImplemented('refreshData');
        },
        removeGeoLocationListener: async (id) => {
            const { shouldRemove } = removeApiListener('geoLocationListener', id);

            if (shouldRemove) {
                // App does not support removal of request geo location call with permanent true which makes this a
                // no-op
            }
        },
        removeScrollListener: async (id) => {
            const { shouldRemove } = removeApiListener('scrollListener', id);

            if (shouldRemove && this.scrollListener) {
                window.removeEventListener('scroll', this.scrollListener);
                this.scrollListener = null;
            }
        },
        removeVisibilityChangeListener: async (id) => {
            const { shouldRemove } = removeApiListener('visibilityChangeListener', id);
            if (shouldRemove) {
                // App does not support removal of onActivate callback which makes this a no-op
            }
        },
        removeToolbarChangeListener: async (id) => {
            const { shouldRemove } = removeApiListener('toolbarChangeListener', id);
            if (shouldRemove) {
                // App does not support removal of onToolbarBarRemove callback which makes this a no-op
            }
        },
        removeWindowMetricsListener: async (id) => {
            const shouldRemove = removeApiListener('windowMetricsListener', id);
            if (shouldRemove) {
                void this.exposedFunctions.removeWindowMetricsListener(id);
                if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
                this.resizeListener = null;
            }
        },
        selectPage: async (options) => {
            if (this.values?.site?.id && options.siteId && options.siteId !== this.values?.site?.id) {
                const url = new URL(`https://chayns.site/${options.siteId}`);
                if (options.id) {
                    url.pathname += `/tapp/${options.id}`;
                } else if (options.path) {
                    url.pathname += `/${options.path}`;
                }
                if (options.params) {
                    Object.entries(options.params).forEach(([k, v]) => {
                        url.searchParams.set(k, v);
                    });
                }
                void this.appCall(9, {
                    url: url.toString(),
                    checkForChaynsSite : true,
                });
                return;
            }
            void this.appCall(2, {
                id: options.id,
                showName: options.showName,
                position: options.position,
                params: [new URLSearchParams(options.params).toString()] || undefined,
            }, {
                awaitResult: false,
            });
        },
        scrollToY: async (position, duration) => {
            window.scrollTo({
                top: position,
                behavior: duration ? 'smooth' : 'auto',
            });
        },
        scrollByY: (value, duration) => {
            window.scrollBy({
                top: value,
                behavior: duration ? 'smooth' : 'auto',
            });
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
            this.notImplemented('setAdminMode');
        },
        setDisplayTimeout: async (enabled) => {
            this.appCall(94, { enabled }, { awaitResult: false });
            return {
                isEnabled: enabled,
            };
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
            this.notImplemented('setOverlay');
        },
        setOverlay: async () => {
            this.notImplemented('setOverlay');
        },
        setRefreshScrollEnabled: async (isEnabled) => {
            this.appCall(0, {
                enabled: isEnabled,
            }, { awaitResult: false });
            return {
                isEnabled,
            };
        },
        setScanQrCode: async (value) => {
            return await this.appCall(34, value) as Promise<ScanQrCodeResult>;
        },
        setTempDesignSettings: async () => {
            this.notImplemented('setTempDesignSettings');
        },
        setWaitCursor: async (value) => {
            void this.appCall(1, {
                enabled: value.isEnabled,
                text: value.text,
                timeout: value.timeout,
                progress: value.progress,
                progressText: value.progressText,
                disappearTimeout: value.disappearTimeout,
            }, {
                awaitResult: false,
            });
        },
        storageGetItem: async (key, accessMode) => {
            const result = await this.appCall(74, {
                key,
                accessMode,
            });
            return result?.object;
        },
        storageRemoveItem: async (key, accessMode) => {
            this.appCall(73, {
                key,
                accessMode,
            }, { awaitResult: false });
        },
        storageSetItem: async (key, value, accessMode, tappIds) => {
            this.appCall(73, {
                key,
                object: value as unknown,
                accessMode,
                tappIDs: tappIds,
            }, {
                awaitResult: false,
            });
        },
        vibrate: async (value) => {
            void this.appCall(19, value, { awaitResult: false });
        },
        createDialog: (config) => {
            return new DialogHandler(config, this.functions.openDialog, this.functions.closeDialog, this.functions.dispatchEventToDialogClient, this.functions.addDialogClientEventListener);
        },
        openDialog: async (config, callback) => {
            const currentDialogId = appWrapperDialogId++;

            const isSupported = isAppCallSupported({ minAndroidVersion: 7137, minIOSVersion: 6934 });

            this.appCall(184, {
                dialogContent: {
                    apiVersion: 5,
                    config,
                },
                externalDialogUrl: isSupported ? undefined : 'https://tapp.chayns-static.space/api/dialog-v2/v1/index.html',
            }, { awaitResult: true }).then((result) => {
                callback(result);
            });

            return currentDialogId;
        },
        closeDialog: (dialogId, result, buttonType = -1) => {
            const dialog = this.dialogs.find(x => x.dialogId === dialogId);
            if (dialog) {
                dialog.resolve({ buttonType, result });
            }
        },
        dispatchEventToDialogClient: () => this.notImplemented('dispatchEventToDialogClient'),
        addDialogClientEventListener: () => this.notImplemented('addDialogClientEventListener'),
        addAnonymousAccount: async () => {
            return this.appCall(302);
        },
    };

    private dialogs = [];

    async init() {
        this.values = this.mapOldApiToNew(await this.appCall(18));
        this.values.siteSettings = await this.loadSiteSettings(this.values.site.id);

        document.documentElement.classList.add('chayns-api--app');

        this.appCall(66, {
            enabled: true,
        }, {
            callback: async() => {
                this.values = this.mapOldApiToNew(await this.appCall(18));
                document.dispatchEvent(new CustomEvent('chayns_api_data', { detail: { type: 'user', value: this.values.user } }));
            },
            awaitResult: true
        });

        window.disablev4DesignSettingsChangeListener = true;

        this.appCall(254, {
            enabled: true,
        }, {
            callback: ({ colorMode }) => {
                this.values.site = { ...this.values.site, colorMode };
                document.dispatchEvent(new CustomEvent('chayns_api_data', { detail: { type: 'site', value: this.values.site } }));
            },
            awaitResult: true
        });

        return undefined;
    }

    getSSRData() {
        return null;
    }

    addDataListener(cb: DataChangeCallback): CleanupCallback {
        const listener = (ev: CustomEventInit<DataChangeValue>) => ev.detail && cb(ev.detail);
        document.addEventListener('chayns_api_data', listener);
        return () => {
            document.removeEventListener('chayns_api_data', listener);
        };
    }

    subscribe = (listener: () => void) => {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        }
    }

    emitChange = () => {
        this.listeners.forEach((l) => l());
    }

    getInitialData() {
        return this.values;
    }
}
