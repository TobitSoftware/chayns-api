/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as comlink from 'comlink';
import DialogHandler from '../handler/DialogHandler';
import {
    AccessToken,
    ChaynsReactFunctions,
    ChaynsReactValues,
    CleanupCallback,
    DataChangeCallback,
    DataChangeValue, Dialog, DialogButtonType,
    GeoLocation,
    IChaynsReact,
    ScrollListenerResult, ToolbarChangeListenerResult,
} from '../types/IChaynsReact';
import { addVisibilityChangeListener, removeVisibilityChangeListener } from '../calls/visibilityChangeListener';
import { addApiListener, dispatchApiEvent, removeApiListener } from '../helper/apiListenerHelper';
import getUserInfo from '../calls/getUserInfo';
import { sendMessageToGroup, sendMessageToPage, sendMessageToUser } from '../calls/sendMessage';
import { setTappHeight } from '../util/heightHelper';

export class FrameWrapper implements IChaynsReact {

    private resolve: (value: unknown) => void = null!;

    private exposedFunctions: ChaynsReactFunctions = null!;

    private exposedCustomFunctions: IChaynsReact["customFunctions"] = {};

    private exposedCustomFunctionNames: string[] = [];

    private resizeListener: ((ev: UIEvent) => void) | null = null;

    ready = new Promise((res) => { this.resolve = res });

    values: ChaynsReactValues = null!;

    listeners: (() => void)[] =  [];

    functions: ChaynsReactFunctions = {
        addGeoLocationListener: async (value , callback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.addGeoLocationListener(value, callback && comlink.proxy((result: GeoLocation) => callback(result)));
        },
        addScrollListener: async (value, callback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.addScrollListener(value, callback && comlink.proxy((result: ScrollListenerResult) => callback(result)));
        },
        addVisibilityChangeListener: async (callback) => addVisibilityChangeListener(callback),
        addToolbarChangeListener: async (callback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.addToolbarChangeListener(callback && comlink.proxy((result: ToolbarChangeListenerResult) => callback(result)));
        },
        addWindowMetricsListener: async (callback) => {
            if (!this.initialized) await this.ready;

            return this.exposedFunctions.addWindowMetricsListener(comlink.proxy((result) => {
                callback(result);
            }));
        },
        customCallbackFunction: async (type, data) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.customCallbackFunction(type, data);
        },
        getAvailableSharingServices: async () => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.getAvailableSharingServices();
        },
        getAccessToken: async (accessToken?: AccessToken) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.getAccessToken(accessToken);
        },
        getCustomCookie: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.getCustomCookie(value);
        },
        getGeoLocation: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.getGeoLocation(value);
        },
        getUserInfo: async (query) => {
            if (!this.initialized) await this.ready;
            return getUserInfo(this, query);
        },
        getScrollPosition: async () => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.getScrollPosition();
        },
        getWindowMetrics: async () => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.getWindowMetrics();
        },
        invokeCall: async (value, callback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.invokeCall(value, callback && comlink.proxy((result) => callback(result)));
        },
        invokeDialogCall: async (value, callback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.invokeDialogCall(value, callback && comlink.proxy((result) => callback(result)));
        },
        login: async(value, callback, closeCallback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.login(value, callback && comlink.proxy((result) => callback(result)), closeCallback && comlink.proxy(() => closeCallback()));
        },
        logout: async () => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.logout();
        },
        navigateBack: async () => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.navigateBack();
        },
        openImage: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.openImage(value);
        },
        openMedia: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.openMedia(value);
        },
        openUrl: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.openUrl(value);
        },
        openVideo: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.openVideo(value);
        },
        refreshAccessToken: async () => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.refreshAccessToken();
        },
        refreshData: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.refreshData(value);
        },
        removeGeoLocationListener: async (id) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.removeGeoLocationListener(id);
        },
        removeScrollListener: async (id) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.removeScrollListener(id);
        },
        removeVisibilityChangeListener(number) {
            removeVisibilityChangeListener(number);
            return Promise.resolve();
        },
        removeWindowMetricsListener: async (id) => {
            if (!this.initialized) await this.ready;

            return this.exposedFunctions.removeWindowMetricsListener(id);
        },
        removeToolbarChangeListener: async (id) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.removeToolbarChangeListener(id);
        },
        selectPage: async(options) => {
            if (!this.initialized) await this.ready;
            await this.exposedFunctions.selectPage(options);
        },
        scrollToY: async(position, duration) => {
            if (!this.initialized) await this.ready;
            await this.exposedFunctions.scrollToY(position, duration);
        },
        sendMessageToGroup: async (groupId, message) => {
            if (!this.initialized) await this.ready;
            return sendMessageToGroup(this, message, groupId);
        },
        sendMessageToPage: async (message) => {
            if (!this.initialized) await this.ready;
            return sendMessageToPage(this, message);
        },
        sendMessageToUser: async (userId, message) => {
            if (!this.initialized) await this.ready;
            return sendMessageToUser(this, message, userId);
        },
        setAdminMode: async (enabled) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setAdminMode(enabled);
        },
        setCustomCookie: async (value) => {
            if (!this.initialized) await this.ready;
            await this.exposedFunctions.setCustomCookie(value);
        },
        setDisplayTimeout: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setDisplayTimeout(value);
        },
        setFloatingButton: async (value, callback) => {
            if (!this.initialized) await this.ready;
            value.items = value.items ?? [];
            const itemClickFunctions = value.items.map(x => (x.onClick));
            value.items = value.items.map((x) => ({ ...x, onClick: undefined }));
            const cb = callback && comlink.proxy((data) => {
                if(data?.item && itemClickFunctions[data.index]) {
                    itemClickFunctions[data.index]!();
                } else {
                    callback();
                }
            });
            // @ts-ignore
            return this.exposedFunctions.setFloatingButton(value, cb);
        },
        setHeight: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setHeight(value);
        },
        setOverlay: async (value, callback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setOverlay(value, callback && comlink.proxy(() => callback()));
        },
        setRefreshScrollEnabled: async (enabled) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setRefreshScrollEnabled(enabled);
        },
        setScanQrCode: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setScanQrCode(value ?? { cancel: false });
        },
        setTempDesignSettings: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setTempDesignSettings(value);
        },
        setWaitCursor: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setWaitCursor(value);
        },
        storageGetItem: async (key, accessMode) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.storageGetItem(key, accessMode);
        },
        storageRemoveItem: async (key, accessMode) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.storageRemoveItem(key, accessMode);
        },
        storageSetItem: async (key, value, accessMode, tappIds) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.storageSetItem(key, value, accessMode, tappIds);
        },
        vibrate: async (value) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.vibrate(value);
        },
        scrollByY: async (value, duration) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.scrollByY(value, duration);
        },
        createDialog: <I, R>(config: Dialog<I>) => {
            return new DialogHandler<R>(config, this.functions.openDialog, this.exposedFunctions.closeDialog, this.functions.dispatchEventToDialogClient, this.functions.addDialogClientEventListener);
        },
        closeDialog: async (dialogId) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.closeDialog(dialogId);
        },
        openDialog: async (config, callback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.openDialog(config, comlink.proxy(callback));
        },
        setDialogResult: async (buttonType: DialogButtonType, result: any) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.setDialogResult(buttonType, result);
        },
        dispatchEventToDialogClient: async (dialogId: number, data: object) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.dispatchEventToDialogClient(dialogId, data);
        },
        addDialogClientEventListener: async (dialogId: number, callback: (data: object) => void) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.addDialogClientEventListener(dialogId, comlink.proxy(callback));
        },
        dispatchEventToDialogHost: async (data: object) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.dispatchEventToDialogHost(data);
        },
        addDialogHostEventListener: async (callback: (data: object) => void) => {
            if (!this.initialized) await this.ready;

            return this.exposedFunctions.addDialogHostEventListener(comlink.proxy((data) => {
                callback(data);
            }));
        },
        removeDialogHostEventListener: async (id: number) => {
            if (!this.initialized) await this.ready;

            return this.exposedFunctions.removeDialogHostEventListener(id);
        },
        removeDialogClientEventListener: async () => {

        },
        addAnonymousAccount: async () => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.addAnonymousAccount();
        },
        addAccessTokenChangeListener: async (options, callback) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.addAccessTokenChangeListener(options, callback && comlink.proxy((result) => callback(result)));
        },
        removeAccessTokenChangeListener: async (id) => {
            if (!this.initialized) await this.ready;
            return this.exposedFunctions.removeAccessTokenChangeListener(id);
        }
    };

    customFunctions = new Proxy({}, {
        get: (target, p: string): any => {
            if (p in target) {
                return target[p];
            }
            return target[p] = async (...args) => {
                if (!this.initialized) await this.ready;
                const wrappedArgs = args.map((v) => typeof v === 'function' ? comlink.proxy(v) : v);
                return this.exposedCustomFunctions[p](...wrappedArgs);
            }
        },
    });

    initialized = false;

    constructor() {
        const initialDataTag = document.querySelector('#__CHAYNS_DATA__');
        if (initialDataTag) {
            this.values = JSON.parse(initialDataTag.innerHTML) as ChaynsReactValues;
        }
    }

    async init() {
        if (this.initialized) return;

        const exposed = comlink.wrap(comlink.windowEndpoint(window.parent))[window.name] as comlink.Remote<IChaynsReact & { _customFunctionNames?: string[] }>;
        const dataListener: () => Promise<CleanupCallback> = () => exposed.addDataListener(comlink.proxy(({ type, value }) => {
            if (this.initialized) {
                this.values[type] = value;
            }

            document.dispatchEvent(new CustomEvent('chayns_api_data', { detail: { type, value } }));
        }));

        let hostReadyCallback: ((ev: MessageEvent) => void) | null = null;

        await Promise.race([
            dataListener(),
            new Promise((resolve) => {
                window.addEventListener('message', hostReadyCallback = (ev) => {
                    if (ev.data === 'chayns-api-host-ready') {
                        void dataListener().then(resolve);
                    }
                });
            }),
        ]);

        if (hostReadyCallback) window.removeEventListener('message', hostReadyCallback);

        this.values = await exposed.getInitialData();
        this.exposedFunctions = exposed.functions as unknown as ChaynsReactFunctions;
        this.exposedCustomFunctions = exposed.customFunctions as unknown as IChaynsReact["customFunctions"];
        this.exposedCustomFunctionNames = (await exposed._customFunctionNames) ?? [];

        this.customFunctions = this.exposedCustomFunctionNames.reduce((p, e) => {
            p[e] = (...args) => this.exposedCustomFunctions[e](...args.map(a => typeof a === 'function' ? comlink.proxy(a) : a))
            return p;
        }, {});

        this.initialized = true;
        this.resolve(null);

        setTappHeight(this.functions.setHeight);
    }

    addDataListener(cb: DataChangeCallback) {
        const listener = (ev: CustomEventInit<DataChangeValue>) => ev.detail && cb(ev.detail);
        document.addEventListener('chayns_api_data', listener)
        return () => {document.removeEventListener('chayns_api_data', listener)}
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

    getSSRData() {
        return null;
    }

    getInitialData (){
        return this.values;
    };
}
