import { moduleWrapper } from '../components/moduleWrapper';
import {
    AppFlavor,
    ChaynsReactFunctions,
    ChaynsReactValues,
    DataChangeCallback,
    IChaynsReact,
} from '../types/IChaynsReact';
import getDeviceInfo from '../util/deviceHelper';
import { AppWrapper } from './AppWrapper';
import { FrameWrapper } from './FrameWrapper';
import { ModuleFederationWrapper } from './ModuleFederationWrapper';

class StaticChaynsApi implements ChaynsReactFunctions {
    addGeoLocationListener!: ChaynsReactFunctions['addGeoLocationListener'];
    addScrollListener!: ChaynsReactFunctions['addScrollListener'];
    addVisibilityChangeListener!: ChaynsReactFunctions['addVisibilityChangeListener'];
    addToolbarChangeListener!: ChaynsReactFunctions['addToolbarChangeListener'];
    addWindowMetricsListener!: ChaynsReactFunctions['addWindowMetricsListener'];
    customCallbackFunction!: ChaynsReactFunctions['customCallbackFunction'];
    getAvailableSharingServices!: ChaynsReactFunctions['getAvailableSharingServices'];
    getAccessToken!: ChaynsReactFunctions['getAccessToken'];
    getCustomCookie!: ChaynsReactFunctions['getCustomCookie'];
    getGeoLocation!: ChaynsReactFunctions['getGeoLocation'];
    getUserInfo!: ChaynsReactFunctions['getUserInfo'];
    getScrollPosition!: ChaynsReactFunctions['getScrollPosition'];
    getWindowMetrics!: ChaynsReactFunctions['getWindowMetrics'];
    invokeCall!: ChaynsReactFunctions['invokeCall'];
    invokePaymentCall!: ChaynsReactFunctions['invokePaymentCall'];
    invokeDialogCall!: ChaynsReactFunctions['invokeDialogCall'];
    login!: ChaynsReactFunctions['login'];
    logout!: ChaynsReactFunctions['logout'];
    navigateBack!: ChaynsReactFunctions['navigateBack'];
    openImage!: ChaynsReactFunctions['openImage'];
    openUrl!: ChaynsReactFunctions['openUrl'];
    openVideo!: ChaynsReactFunctions['openVideo'];
    openMedia!: ChaynsReactFunctions['openMedia'];
    refreshData!: ChaynsReactFunctions['refreshData'];
    refreshAccessToken!: ChaynsReactFunctions['refreshAccessToken'];
    removeGeoLocationListener!: ChaynsReactFunctions['removeGeoLocationListener'];
    removeScrollListener!: ChaynsReactFunctions['removeScrollListener'];
    removeVisibilityChangeListener!: ChaynsReactFunctions['removeVisibilityChangeListener'];
    removeToolbarChangeListener!: ChaynsReactFunctions['removeToolbarChangeListener'];
    removeWindowMetricsListener!: ChaynsReactFunctions['removeWindowMetricsListener'];
    selectPage!: ChaynsReactFunctions['selectPage'];
    scrollToY!: ChaynsReactFunctions['scrollToY'];
    sendMessageToGroup!: ChaynsReactFunctions['sendMessageToGroup'];
    sendMessageToPage!: ChaynsReactFunctions['sendMessageToPage'];
    sendMessageToUser!: ChaynsReactFunctions['sendMessageToUser'];
    setAdminMode!: ChaynsReactFunctions['setAdminMode'];
    setCustomCookie!: ChaynsReactFunctions['setCustomCookie'];
    setDisplayTimeout!: ChaynsReactFunctions['setDisplayTimeout'];
    setFloatingButton!: ChaynsReactFunctions['setFloatingButton'];
    setHeight!: ChaynsReactFunctions['setHeight'];
    setRefreshScrollEnabled!: ChaynsReactFunctions['setRefreshScrollEnabled'];
    setScanQrCode!: ChaynsReactFunctions['setScanQrCode'];
    setTempDesignSettings!: ChaynsReactFunctions['setTempDesignSettings'];
    setWaitCursor!: ChaynsReactFunctions['setWaitCursor'];
    storageGetItem!: ChaynsReactFunctions['storageGetItem'];
    storageRemoveItem!: ChaynsReactFunctions['storageRemoveItem'];
    storageSetItem!: ChaynsReactFunctions['storageSetItem'];
    vibrate!: ChaynsReactFunctions['vibrate'];
    scrollByY!: ChaynsReactFunctions['scrollByY'];
    setOverlay!: ChaynsReactFunctions['setOverlay'];
    createDialog!: ChaynsReactFunctions['createDialog'];
    openDialog!: ChaynsReactFunctions['openDialog'];
    closeDialog!: ChaynsReactFunctions['closeDialog'];
    setDialogResult!: ChaynsReactFunctions['setDialogResult'];
    dispatchEventToDialogClient!: ChaynsReactFunctions['dispatchEventToDialogClient'];
    addDialogClientEventListener!: ChaynsReactFunctions['addDialogClientEventListener'];
    removeDialogClientEventListener!: ChaynsReactFunctions['removeDialogClientEventListener'];
    dispatchEventToDialogHost!: ChaynsReactFunctions['dispatchEventToDialogHost'];
    addDialogHostEventListener!: ChaynsReactFunctions['addDialogHostEventListener'];
    removeDialogHostEventListener!: ChaynsReactFunctions['removeDialogHostEventListener'];
    addAnonymousAccount!: ChaynsReactFunctions['addAnonymousAccount'];
    addAccessTokenChangeListener!: ChaynsReactFunctions['addAccessTokenChangeListener'];
    removeAccessTokenChangeListener!: ChaynsReactFunctions['removeAccessTokenChangeListener'];
    redirect!: ChaynsReactFunctions['redirect'];

    ready: Promise<void>;
    addDataListener: (cb: DataChangeCallback) => () => void;

    private _wrapper: IChaynsReact;

    constructor(values?: ChaynsReactValues, functions?: ChaynsReactFunctions) {
        let wrapper: IChaynsReact;
        const deviceInfo = getDeviceInfo(navigator.userAgent, '');
        if (values && functions) {
            wrapper = new ModuleFederationWrapper(values, functions);
        } else if (deviceInfo.app?.flavor === AppFlavor.Chayns && window.self === window.top) {
            wrapper = new AppWrapper();
        } else {
            wrapper = new FrameWrapper();
        }
        moduleWrapper.current = wrapper;
        this._wrapper = wrapper;
        this.ready = wrapper.init();
        this.addDataListener = wrapper.addDataListener;

        Object.assign(this, wrapper.functions);
    }

    getUser = () => this._wrapper.values.user;
    getSite = () => this._wrapper.values.site;
    getCurrentPage = () => this._wrapper.values.currentPage;
    getDevice = () => this._wrapper.values.device;
    getLanguage = () => this._wrapper.values.language;
    getParameters = () => this._wrapper.values.parameters;
    getPages = () => this._wrapper.values.pages;
    getEnvironment = () => this._wrapper.values.environment;
    getStyleSettings = () => this._wrapper.values.styleSettings;
    getCustomFunction = (key: string) => this._wrapper.customFunctions[key];
    getDialogInput = <T, >(): T => this._wrapper.values.dialog.dialogInput as T;
}

export default StaticChaynsApi;
