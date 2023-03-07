import { Browser, OperatingSystem } from 'detect-browser';
import DialogHandler from '../wrapper/Dialog';
import { DialogButtonOld, SelectDialogItem } from './dialog';

export type DialogButton = {
    type: DialogButtonType,
    text: string
}

export type BaseDialog = {
    text?: string,
    buttons?: DialogButton[],
    dialogId: number
}

export type Dialog = BaseDialog & (DialogInput | DialogModule | DialogIFrame | DialogSelect);

export type DialogModule = {
    type: DialogType.MODULE
    system: {
        url: string,
        module: string,
        scope: string
    },
    dialogInput: {
        [key: string | symbol]: object;
    },
    isClosingRequested: boolean,
}

export type DialogIFrame = {
    type: DialogType.IFRAME
    url: string,
    dialogInput: {
        [key: string | symbol]: object;
    },
    isClosingRequested: boolean,
}

export type DialogInput = {
    type: DialogType.INPUT
    placeholder: string
}

export type DialogSelect = {
    type: DialogType.SELECT,
    list: {
        id: number,
        name: string,
        disabled?: boolean,
        isSelected?: boolean
    }[]
}

export enum DialogButtonType {
    OK = 1,
    CANCEL = -1,
    NEGATIVE = 0
}


export type ChaynsApiUser = {
    firstName?: string;
    lastName?: string;
    gender?: Gender;
    uacGroups?: UacGroup[];
    userId?: number;
    personId?: string;
};

export type ChaynsApiSite = {
    id: string;
    locationId: number;
    locationPersonId: string;
    color: string;
    colorMode: ColorMode;
    dynamicFontSize: boolean;
    layoutDisposition: LayoutDisposition;
    domain: string;
    font: {
        id: Font;
        dynamicFontSize: boolean;
        headlineFont: Font;
    },
    title: string;
    url: string;
    urlHash: string;
}

export enum ScreenSize {
    XS,
    SM,
    MD,
    LG,
    XL
}

export type ChaynsApiDevice = {
    app?: { //  von host
        name: AppName; // user agent
        version: number; // user agent
        storePackageName?: string; // maybe unused
    },
    browser?: { //  von host
        name?: Browser | 'bot' | null; // https://www.npmjs.com/package/detect-browser
        version?: string | null; // https://www.npmjs.com/package/detect-browser
        majorVersion: number;
        isWebPSupported: boolean;
    },
    imei?: string;
    accessToken?: string;
    os?: OperatingSystem | null;
    isTouch: boolean;
    screenSize: ScreenSize;
}

export type DialogHookResult = {
    isClosingRequested: boolean,
    buttonType: DialogButtonType,
    data: any,
    closeDialog: (buttonType, data) => Promise<void>
}

export type DialogDataHookResult = {
    inputData: {
        [key: string | symbol]: object;
    }
}

/**
 * @ignore
 */
export interface ChaynsReactValues {
    site: ChaynsApiSite;
    user: ChaynsApiUser | undefined;
    isAdminModeActive: boolean;
    pages: Page[];
    currentPage: {
        id: number;
        siteId: string;
    }
    device: ChaynsApiDevice;
    language: {
        site: Language;
        translation: Language | null;
        device: Language;
        active: Language;
    },
    /**
     * keys are in lower case
     */
    parameters: {
        [key: string | symbol]: string;
    },
    environment: {
        buildEnvironment: Environment;
        runtimeEnvironment: RuntimeEnviroment | string;
    },
    customData: any,
    dialog: Dialog
}

/**
 * @ignore
 */
export interface ChaynsReactFunctions {
    addGeoLocationListener: (value: { timeout?: number, silent?: boolean }, callback: (geoLocation: GeoLocation) => void) => Promise<number>;
    addScrollListener: (value: { throttle?: number }, callback: (result: ScrollListenerResult) => void) => Promise<number>;
    addVisibilityChangeListener: (callback: (result: VisibilityChangeListenerResult) => void) => Promise<number>;
    addWindowMetricsListener: (callback: (result: WindowMetricsListenerResult) => void) => Promise<number>;
    customCallbackFunction: (type: string, data: unknown) => Promise<unknown>;
    getAvailableSharingServices: () => Promise<AvailableSharingServices>;
    getAccessToken: (value?: AccessToken) => Promise<AccessTokenResult>;
    getGeoLocation: (value: { timeout?: number, silent?: boolean }) => Promise<GeoLocation>;
    getUserInfo: (value: UserInfoQuery) => Promise<UserInfo | null>;
    getScrollPosition: () => Promise<ScrollListenerResult>;
    getWindowMetrics: () => Promise<WindowMetricsListenerResult>;
    invokeCall: (value: InvokeCall, callback?: (result: any) => void) => Promise<any>;
    invokeDialogCall: (value: InvokeCall, callback?: (result: any) => void) => Promise<any>;
    login: (value?: Login, callback?: (result: boolean) => void, closeCallback?: () => void) => Promise<LoginResult>;
    logout: () => Promise<void>;
    navigateBack: () => Promise<void>;
    openImage: (value: OpenImage) => Promise<void>;
    openUrl: (value: OpenUrl) => Promise<void>;
    openVideo: (value: OpenVideo) => Promise<void>;
    refreshData: (value: RefreshData) => Promise<void>; // TODO: Naming
    refreshAccessToken: () => Promise<void>;
    removeGeoLocationListener: (value: number) => Promise<void>;
    removeScrollListener: (value: number) => Promise<void>;
    removeVisibilityChangeListener: (value: number) => Promise<void>;
    removeWindowMetricsListener: (value: number) => Promise<void>;
    selectPage: (value: SelectPage) => Promise<void>;
    scrollToY: (position: number, duration: number) => Promise<void>;
    sendMessageToGroup: (groupId: number, message: IntercomMessage) => Promise<Response>;
    sendMessageToPage: (message: IntercomMessage) => Promise<Response>;
    sendMessageToUser: (userId: number, message: IntercomMessage) => Promise<Response>;
    setAdminMode: (enabled: boolean) => Promise<void>;
    setDisplayTimeout: (enabled: boolean) => Promise<DisplayTimeout>;
    setFloatingButton: (value: FloatingButton, callback: () => void) => Promise<void>;
    setHeight: (height: number) => Promise<void>;
    setRefreshScrollEnabled: (enabled: boolean) => Promise<RefreshScrollEnabled>;
    setScanQrCode: (value: ScanQrCodeRequest) => Promise<ScanQrCodeResult>;
    setTempDesignSettings: (value: DesignSettings) => Promise<void>;
    setWaitCursor: (value: WaitCursor) => Promise<void>;
    storageGetItem: (key: string, accessMode?: AccessMode) => Promise<any>;
    storageRemoveItem: (key: string, accessMode?: AccessMode) => Promise<void>;
    storageSetItem: (key: string, value: any, accessMode?: AccessMode, tappIds?: number[]) => Promise<void>;
    vibrate: (value: Vibrate) => Promise<void>;
    scrollByY: (position: number, duration?: number) => Promise<void>;
    // findSite: () => Promise<void>; // TODO: Maybe unused
    // findPerson: () => Promise<void>; // TODO: Maybe unused
    setOverlay: (value: ShowOverlay, callback: () => void) => Promise<void>;
    // public interface to create dialogs
    createDialog: (config: Dialog) => DialogHandler;
    // used internally by createDialog
    openDialog: (value, callback: (data: any) => any) => Promise<any>;
    // used internally by createDialog
    closeDialog: (dialogId: number) => Promise<void>;
    // used internally by dialogs only
    setDialogResult: (result: any) => Promise<void>;
}

export type DialogResult = {
    open: () => Promise<any>,
    close: (buttonType: DialogButtonType, data) => Promise<void>
}

export type SelectPage = {
    id?: number,
    position?: number,
    path?: string,
    showName?: string,
    forceSelect?: boolean,
    params?: {
        [key: string]: string
    },
    preventHistory?: boolean,
    siteId?: string,
    isAdminMode?: boolean
}

export type AccessToken = {
    external?: boolean
}

export type AccessTokenResult = {
    accessToken: string | undefined
}

export enum AccessMode {
    public,
    protected,
    'private',
}

export interface RefreshData {
    suffix?: boolean;
    tapps?: boolean;
    user?: boolean;
}

export type IntercomMessage = {
    text: string;
    images?: string[];
}

export enum ScanQrCodeCodeType {
    QR = 0,
    BARCODE = 0,
    ALL = 2
}

export enum ScanQrCodeCameraTypes {
    AUTO = 0,
    BACK = 1,
    FRONT = 2
}

export type ScanQrCodeRequest = {
    cancel?: boolean;
    timeout?: number;
    cameraType?: ScanQrCodeCameraTypes;
    dialogTitle?: string,
    dialogSubtitle?: string,
    enableFlashToggle?: boolean,
    enableCameraSwitch?: boolean,
    ccAnimation?: boolean,
    geoLocation?: boolean,
    showInput?: boolean,
    codeType?: ScanQrCodeCodeType,
    codeFormats?: 4 | 5
}

export type ScanQrCodeResult = {
    qrCode: string;
    geoLocation?: {
        latitude: number;
        longitude: number;
        speed: number;
    };
    status: number;
    resultType: number;
}

enum IOSFeedbackVibration {
    Unknown,
    SelectionChanged,
    NotificationError,
    NotificationSuccess,
    NotificationWarning,
    Light,
    Medium,
    Heavy,
    Soft,
    Rigid
}

export interface Vibrate {
    pattern: number[];
    iOSFeedbackVibration?: IOSFeedbackVibration;
}

export interface ShowOverlay {
    show?: boolean;
    header?: boolean;
    url: string;
    background?: boolean;
    height?: string | number;
    login?: boolean;
}

// region design settings
enum SnapshotType {
    Background = 'background',
    Settings = 'settings',
    ColorScheme = 'colorScheme',
    Cover = 'cover',
    Tapp = 'tapp'
}

enum DesignSettingsUpdateBackgroundType {
    None,
    Image,
    Video,
    Color
}

interface DesignSettingsUpdateGradient {
    startColor?: string,
    endColor: string;
    type: number;
}

interface DesignSettingsUpdateBackground {
    canvasBlur?: number;
    canvasOpacity?: number;
    color?: string;
    filter?: string;
    isRepeat?: boolean;
    type?: DesignSettingsUpdateBackgroundType;
    url?: string;
    gradient?: DesignSettingsUpdateGradient;
}

enum DesignSettingsUpdateSeasonTypes {
    None,
    Snowm,
    Confetti,
    Leaf,
    Heart,
    Balloon,
    Eastern,
    Clover,
    Coins
}

enum DesignSettingsUpdateGalleryAnimationTypes {
    Swipe,
    Fade,
    Parallax,
    KenBurns
}

enum DesignSettingsUpdateCoverTypes {
    Image,
    Video,
    Slideshow,
    Frame,
    None
}

interface DesignSettingsUpdateCover {
    animationType: DesignSettingsUpdateGalleryAnimationTypes;
    seasonAnimation?: DesignSettingsUpdateSeasonTypes;
    fallbackUrl?: string;
    hide?: boolean;
    overlayUrl?: string;
    type: DesignSettingsUpdateCoverTypes;
    urls: string[];
}

enum DesignSettingsUpdateColorSchemeMode {
    Normal,
    Dark,
    Bright
}

interface DesignSettingsUpdateColorScheme {
    color: string;
    mode: DesignSettingsUpdateColorSchemeMode;
}

interface DesignSettingsUpdateGlobalSettings {
    useChatHead?: boolean;
    addBackgroundColorInHeader?: boolean;
    enableStagingSwitch?: boolean;
    hideNavigationButton?: boolean;
}

enum DesignSettingsUpdateTappViewModes {
    Normal,
    Exclusive,
    Wide,
    Fullscreen,
    FullscreenWithBackground
}

interface DesignSettingsUpdateTapp {
    viewMode?: DesignSettingsUpdateTappViewModes;
    removeLocationBarHeight?: boolean;
}

export interface DesignSettings {
    snapshot?: boolean;
    resetOnTappChange?: boolean;
    reset?: boolean;
    updates: DesignSettingsUpdateItem[];
}

interface DesignSettingsUpdateItem {
    type: SnapshotType,
    value: DesignSettingsUpdateBackground | DesignSettingsUpdateCover | DesignSettingsUpdateColorScheme | DesignSettingsUpdateGlobalSettings | DesignSettingsUpdateTapp
}

// endregion

export interface IChaynsReact {
    values: ChaynsReactValues;
    functions: ChaynsReactFunctions;
    addDataListener: (cb: DataChangeCallback) => CleanupCallback;
    getSSRData: () => ChaynsReactValues | null;
    init: () => Promise<void>;
    getInitialData: () => ChaynsReactValues;
}

export interface OpenUrl {
    sameWindow?: boolean;
    url: string;
    openInApp?: boolean;
    overlay?: boolean;
}

export interface UserInfo {
    personId: string;
    userId: number;
    firstName: string;
    lastName: string;
    name: string;
}

export type UserInfoQuery = {
    personId: string;
    userId?: never;
} | {
    personId?: string;
    userId: number;
}

type OpenImageItem = {
    url: string;
    title?: string;
    description?: string;
    preventCache?: boolean;
}

export interface OpenImage {
    items: [OpenImageItem, ...OpenImageItem[]],
    startIndex?: number;
}

export interface OpenVideo {
    url: string;
}

enum LoginState {
    FACEBOOK = 0,
    T_WEB = 1,
    LoginFailed = 2,
    AlreadyLoggedIn = 3,
    SUCCESS = 4
}

export interface LoginResult {
    loginState: LoginState;
}

export interface Login {
    ignoreAuthenticated: boolean;
}

export interface InvokeCall {
    action: number;
    value?: object;
}

export interface WaitCursor {
    isEnabled: boolean;
    text?: string,
    timeout?: number;
    progress?: number;
    progressText?: string;
    disappearTimeout?: number;
}

export enum FloatingButtonPosition {
    Right,
    Center,
    Left
}

export interface FloatingButton {
    isEnabled: boolean;
    position: FloatingButtonPosition;
    zIndex: number;
    badge: string;
    textSize: number;
    color: string;
    colorText: string;
    icon: string;
    text: string;
    rotateIcon: boolean;
    items: {
        onClick?: () => Promise<void>;
        text: string;
        icon: string;
    }[];
}

export enum SharingApp {
    Mail,
    WhatsApp,
    Facebook,
    FacebookMessenger,
    GooglePlus,
    Twitter
}

export interface AvailableSharingServices {
    availableSharingApps: SharingApp[];
    availableAndroidApps?: string[];
}

export interface DisplayTimeout {
    isEnabled: boolean;
}

export interface AdminMode {
    isEnabled: boolean;
}

export interface RefreshScrollEnabled {
    isEnabled: boolean;
}

export interface GeoLocation {
    accuracy: number | null;
    latitude: number;
    longitude: number;
    speed: number;
    code: number;
}

export type DataChangeValue = {
    type: 'page';
    value: Page[];
} | {
    type: 'user';
    value: ChaynsApiUser | undefined;
} | {
    type: 'site';
    value: ChaynsApiSite;
} | {
    type: 'isAdminModeActive',
    value: ChaynsReactValues['isAdminModeActive']
}


export type DataChangeCallback = ((value: DataChangeValue) => void);
export type CleanupCallback = (() => void);

export interface WindowMetricsListenerResult {
    bottomBarHeight: number;
    topBarHeight: number;
    offsetTop: number;
    windowHeight: number;
    pageHeight: number;
    pageWidth: number;
    pageSize: ScreenSize;
}

export enum TappEvent {
    OnShow = 0,
    OnHide = 1,
    OnRefresh = 2,
    OnOpenCcScanner = 3,
    OnCloseCcScanner = 4
}

export interface VisibilityChangeListenerResult {
    isVisible: boolean;
    tappEvent: TappEvent;
}

export interface ScrollListenerResult { // ?
    scrollX: number | null;
    scrollY: number | null;
}

interface LayoutDisposition {
    barOnTop: boolean;
    barWide: boolean;
    contentWide: boolean;
    coverDetached: boolean;
    coverHidden: boolean;
    coverWide: boolean;
    docked: boolean;
}


interface UacGroup {
    id: number;
}

export enum IconType {
    Font,
    Base64,
    Url
}

export interface Page {
    id: number;
    icon: string;
    iconType: IconType;
    customUrl: string;
    isExclusive: boolean;
    isHiddenFromMenu: boolean;
    minAge: number;
    name: string;
    sortId: number;
    siteId: string;
    uacGroups: UacGroup[];
}

export enum Gender {
    Unknown = 0,
    male = 1,
    female = 2,
    diverse = 9
}

export enum ColorMode {
    Classic,
    Dark,
    Light
}

export enum Language {
    Unknown = 'unknown',
    German = 'de',
    English = 'en',
    Dutch = 'nl',
    French = 'fr',
    Spanish = 'es',
    Italian = 'it',
    Portuguese = 'pt',
    Turkish = 'tr',
    Polish = 'pl',
    Ukrainian = 'uk'
}

export enum RuntimeEnviroment {
    Unknown,
    ChaynsDe,
    ChaynsWeb, // ?
    ChaynsRuntime,
    IntercomPlugin,
    PagemakerPlugin
}

export enum DeviceOs {
    Unknown = 'unknown',
    Android = 'android',
    IOS = 'ios',
    Windows = 'windows',
    MacOs = 'macos',
    Linux = 'linux'
}

export enum AppName {
    Unknown,
    David,
    Chayns,
    Location,
    Intercom,
    ChaynsLauncher,
}

export enum BrowserName {
    Unknown = 'unknown',
    Chrome = 'chrome',
    Safari = 'safari',
    Firefox = 'firefox',
    Edge = 'edge'
}

export enum Environment {
    Development,
    Qa,
    Staging,
    Production
}

export enum Font {
    Unknown,
    Roboto,
    OpenSans,
    Lato,
    SourceSansPro,
    Ubuntu,
    Cabin,
    Merriweather,
    NotoSerif,
    PTSerif,
    DroidSerif,
    Muli,
    Poppins,
    RobotoCondensed,
    Anton,
    ArchitectsDaughter,
    DMSerifDisplay,
    Pacifico,
    PermanentMarker,
    Questrial,
    RobotoSlab,
    ShadowsIntoLightTwo,
    WaitingForTheSunrise,
    RobotoMedium,
    TobitHeadline,
    RobotoBold,
    RobotoRegular,
    Inter
}

export interface SelectInput {
    title?: string;
    message?: string;
    list: Array<SelectDialogItem>;
    multiselect?: boolean;
    quickfind?: boolean;
    type?: selectType;
    preventCloseOnClick?: boolean;
    buttons?: DialogButtonOld[];
    links?: DialogButtonOld[];
    selectAllButton?: string;
}

enum selectType {
    DEFAULT = 0,
    ICON = 1
}

export enum DialogType {
    ALERT = 'alert',
    CONFIRM = 'confirm',
    DATE = 'date',
    FILE_SELECT = 'fileSelect',
    IFRAME = 'iframe',
    MODULE = 'module',
    INPUT = 'input',
    SELECT = 'select',
    TOAST = 'toast'
}

