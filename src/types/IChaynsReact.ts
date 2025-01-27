import { IBrowser, IEngine } from 'ua-parser-js';
import DialogHandler from '../handler/DialogHandler';
import { DialogButtonOld, SelectDialogItem } from './dialog';

export type DialogButton = {
    type: DialogButtonType,
    text: string
}

export enum DateType {
    DATE,
    TIME,
    DATE_TIME
}
export interface DialogDate {
    type: DialogType.DATE;
    minDate?: Date;
    maxDate?: Date;
    minDuration?: number;
    minuteInterval?: number;
    preselect?: Date | [Date, Date];
    dateType?: DateType;
    multiselect?: boolean;
    monthSelect?: boolean;
    yearSelect?: boolean;
    interval?: boolean;
    disabledDates?: Date[];
    disabledIntervals?: { start: Date; end: Date }[];
    disabledWeekDayIntervals?: { weekDay: WeekDayType ; interval?: {start: string; end: string }}[]
}

export enum WeekDayType {
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
}


export enum ToastType {
    NEUTRAL = 1,
    SUCCESS = 2,
    WARNING = 3,
    ERROR = 4,
}

export interface DialogToast {
    type: DialogType.TOAST;
    icon?: string;
    showDurationBar?: boolean;
    duration?: number;
    linkText?: string;
    onLinkClick?: () => void;
    permanent?: boolean;
    showCloseIcon?: boolean;
    toastType?: ToastType;
}

export interface DialogFileSelect {
    type: DialogType.FILE_SELECT;
    multiselect?: boolean;
    contentType?: Array<string> | string;
    exclude?: Array<string> | string;
    directory?: boolean;
}

export interface DialogConfirm {
    type: DialogType.CONFIRM;
}

export interface DialogAlert {
    type: DialogType.ALERT;
}

export interface BaseDialog {
    text?: string,
    buttons?: DialogButton[],
    width?: string | number,
    animation?: {
        type: DialogAnimation,
        config?: any
    }
}

export type Dialog<T extends any = object> = BaseDialog & (DialogAlert | DialogConfirm | DialogInput | DialogModule<T> | DialogIFrame<T> | DialogSelect | DialogDate | DialogToast | DialogSignature | DialogFileSelect);

export interface DialogSignature {
    type: DialogType.SIGNATURE;
}

export interface DialogModule<T extends any = object> {
    type: DialogType.MODULE
    system: {
        url: string,
        module: string,
        scope: string
    },
    dialogInput?: T,
    backgroundColor?: string;
    allowAnonymousUser?: boolean;
    seamless?: boolean;
}

export interface DialogIFrame<T extends any = object> {
    type: DialogType.IFRAME
    url: string,
    dialogInput?: T,
    backgroundColor?: string;
    allowAnonymousUser?: boolean;
    seamless?: boolean;
}

export enum DialogInputType {
    NUMBER = 'number',
    PASSWORD = 'password',
    TELEPHONE = 'tel',
    TEXT = 'text',
    TEXTAREA = 'textarea',
}
export interface DialogInput {
    type: DialogType.INPUT
    placeholder?: string,
    inputType?: DialogInputType,
    defaultValue?: string,
    formatter?: (input: string) => string,
    regex?: string
}

export enum DialogSelectType {
    DEFAULT = 0,
    ICON = 1,
    IMAGE = 2,
    SIMPLE = 3,
}

export type DialogSelectListItemType = {
    id: number | string;
    name: string;
    disabled?: boolean;
    isSelected?: boolean;
    url?: string;
    /**
     * @deprecated Use {@link icon} instead
     */
    className?: string;
    icon?: string
}

export interface DialogSelect {
    type: DialogType.SELECT,
    list: DialogSelectListItemType[];
    fixedItem?: DialogSelectListItemType & { position?: 'top' | 'bottom' };
    multiselect?: boolean;
    quickfind?: boolean;
    selectType?: DialogSelectType;
    preventCloseOnClick?: boolean;
    selectAllCheckbox?: string;
}

export enum DialogButtonType {
    OK = 1,
    CANCEL = -1,
    NEGATIVE = 0
}


export type ChaynsApiUser = {
    firstName?: string;
    lastName?: string;
    nickName?: string;
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
    originSiteId?: string;
}

export enum ScreenSize {
    /** screen width smaller than or equal 556px */
    XS,
    /** screen width between 557px and 769px */
    SM,
    /** screen width between 770px and 993px */
    MD,
    /** screen width between 994px and 1200px */
    LG,
    /** screen width larger than 1200px */
    XL
}

export type ChaynsApiDevice = {
    app?: { //  von host
        name: AppName; // user agent
        /** @deprecated same value as callVersion */
        version: number; // user agent
        /** the actual app version according to the app name */
        appVersion: number;
        /** the version of the chayns call interface */
        callVersion: number;
        storePackageName?: string; // maybe unused
    },
    browser?: { //  von host
        name?: IBrowser["name"] | 'bot' | null; // https://www.npmjs.com/package/detect-browser
        version?: string | null; // https://www.npmjs.com/package/detect-browser
        majorVersion: number;
        isWebPSupported: boolean;
    },
    engine?: IEngine;
    imei?: string;
    accessToken?: string;
    os?: 'AIX' | 'Amiga OS' | 'Android OS' | 'Arch' | 'Bada' | 'BeOS' | 'BlackBerry' | 'CentOS' | 'Chromium OS' | 'Contiki' | 'Fedora' | 'Firefox OS' | 'FreeBSD' | 'Debian' | 'DragonFly' | 'Gentoo' | 'GNU' | 'Haiku' | 'Hurd' | 'iOS' | 'Joli' | 'Linpus' | 'Linux' | 'Mac OS' | 'Mageia' | 'Mandriva' | 'MeeGo' | 'Minix' | 'Mint' | 'Morph OS' | 'NetBSD' | 'Nintendo' | 'OpenBSD' | 'OpenVMS' | 'OS/2' | 'Palm' | 'PCLinuxOS' | 'Plan9' | 'Playstation' | 'QNX' | 'RedHat' | 'RIM Tablet OS' | 'RISC OS' | 'Sailfish' | 'Series40' | 'Slackware' | 'Solaris' | 'SUSE' | 'Symbian' | 'Tizen' | 'Ubuntu' | 'UNIX' | 'VectorLinux' | 'WebOS' | 'Windows' | 'Windows Phone' | 'Windows Mobile' | 'Zenwalk' | null;
    osVersion?: string;
    isTouch: boolean;
    screenSize: ScreenSize;
}

export type DialogHookResult = {
    isClosingRequested: boolean;
    setResult: ChaynsReactFunctions["setDialogResult"];
    sendData: ChaynsReactFunctions["dispatchEventToDialogHost"];
    addDataListener: ChaynsReactFunctions["addDialogHostEventListener"];
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
        [key: string | symbol]: string | string[];
    },
    environment: {
        buildEnvironment: Environment;
        runtimeEnvironment: RuntimeEnviroment | string;
    },
    customData: any,
    dialog: { dialogInput: any, isClosingRequested: boolean }
}

export interface DialogResultFile {
    blockDownload?: boolean;
    contentType: string;
    filename: string;
    id: number;
    key: string;
    modifyTime: string;
    personId: string;
    protected?: boolean;
    size: number;
    url: string;
}

type DialogResultValue<T> = {
    [DialogType.INPUT]: string,
    [DialogType.SELECT]: (number | string)[],
    [DialogType.CONFIRM]: void,
    [DialogType.ALERT]: void,
    [DialogType.DATE]: Date,
    [DialogType.FILE_SELECT]: DialogResultFile[],
    [DialogType.IFRAME]: T,
    [DialogType.MODULE]: T,
    [DialogType.SIGNATURE]: string,
    [DialogType.TOAST]: void
}

/**
 * @ignore
 */
export interface ChaynsReactFunctions {
    addGeoLocationListener: (value: { timeout?: number, silent?: boolean }, callback: (geoLocation: GeoLocation) => void) => Promise<number>;
    addScrollListener: (value: { throttle?: number }, callback: (result: ScrollListenerResult) => void) => Promise<number>;
    addVisibilityChangeListener: (callback: (result: VisibilityChangeListenerResult) => void) => Promise<number>;
    addToolbarChangeListener: (callback: (result: ToolbarChangeListenerResult) => void) => Promise<number>;
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
    openMedia: (value: OpenMedia) => Promise<void>;
    refreshData: (value: RefreshData) => Promise<void>; // TODO: Naming
    refreshAccessToken: () => Promise<void>;
    removeGeoLocationListener: (value: number) => Promise<void>;
    removeScrollListener: (value: number) => Promise<void>;
    removeVisibilityChangeListener: (value: number) => Promise<void>;
    removeToolbarChangeListener: (value: number) => Promise<void>;
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
    storageGetItem: <T extends object | number | string>(key: string, accessMode?: AccessMode) => Promise<T | undefined>;
    storageRemoveItem: (key: string, accessMode?: AccessMode) => Promise<void>;
    storageSetItem: <T extends object | number | string>(key: string, value: T, accessMode?: AccessMode, tappIds?: number[]) => Promise<void>;
    vibrate: (value: Vibrate) => Promise<void>;
    scrollByY: (position: number, duration?: number) => Promise<void>;
    // findSite: () => Promise<void>; // TODO: Maybe unused
    // findPerson: () => Promise<void>; // TODO: Maybe unused
    setOverlay: (value: ShowOverlay, callback: () => void) => Promise<void>;
    // public interface to create dialogs
    createDialog: <I extends any = undefined, T extends any = undefined, Z extends Dialog<I> = Dialog<I>>(config: Z) => DialogHandler<DialogResultValue<T>[Z["type"]], T>;
    // used internally by createDialog
    openDialog: (value, callback: (data: any) => any) => Promise<any>;
    // used internally by createDialog
    closeDialog: (dialogId: number) => Promise<void>;
    // used internally by dialogs only
    setDialogResult: (buttonType: DialogButtonType, result: any) => Promise<void>;
    dispatchEventToDialogClient: (dialogId: number, data: object) => Promise<void>;
    addDialogClientEventListener: (dialogId: number, callback: (data: object) => void) => Promise<number>;
    removeDialogClientEventListener: (dialogId: number, id: number) => Promise<void>;
    dispatchEventToDialogHost: (data: object) => Promise<void>;
    addDialogHostEventListener: (callback: (data: object) => void) => Promise<number>;
    removeDialogHostEventListener: (id: number) => Promise<void>;
    addAnonymousAccount: () => Promise<AnonymousAccountResult>;
}

export type ChaynsReactCustomFunctions = {
    [key: string]: <A extends Array<any>, O>(...args: A) => Promise<O>;
};

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
    customFunctions: ChaynsReactCustomFunctions;
    addDataListener: (cb: DataChangeCallback) => CleanupCallback;
    getSSRData: () => ChaynsReactValues | null;
    init: () => Promise<void>;
    getInitialData: () => ChaynsReactValues;
    subscribe: (listener: () => void) => () => void;
    emitChange: () => void;
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

export type OpenImageItem = {
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

export enum FloatingButtonAnimation {
    None = 'none',
    FadeIn = 'fade-in',
    Pulse = 'pulse'
}

export interface FloatingButton {
    isEnabled: boolean;
    position?: FloatingButtonPosition;
    zIndex?: number;
    badge?: string;
    textSize?: number;
    color?: string;
    colorText?: string;
    icon?: string;
    text?: string;
    rotateIcon?: boolean;
    items?: {
        onClick?: () => Promise<void>;
        text: string;
        icon: string;
    }[];
    animation?: FloatingButtonAnimation;
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
    latitude: number;
    longitude: number;
    speed: number;
    accuracy: number | null;
    isAccurate: boolean | null;
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

export interface ToolbarChangeListenerResult {
    isVisible: boolean;
    toolbarHeight: number;
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
    PagemakerPlugin,
    Dialog,
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
    TobitChat,
    Sidekick,
    Team,
    CityApp
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
    TOAST = 'toast',
    SIGNATURE = 'signature'
}

export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
}

export type OpenMediaItem = {
    url: string;
    title?: string;
    description?: string;
    preventCache?: boolean;
    mediaType: MediaType;
}

export type OpenMedia = {
    items: [OpenMediaItem, ...OpenMediaItem[]];
    startIndex?: number;
}

export enum DialogAnimation {
    CONFETTI = 'confetti'
}

export enum DialogIconType {
    SuccessIcon = '%%DialogSuccessIcon%%',
    WarningIcon = '%%DialogWarningIcon%%',
    ErrorIcon = '%%DialogErrorIcon%%'
}

export type AnonymousAccountResult = {
    token: string;
}
