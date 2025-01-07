import { moduleWrapper } from '../components/moduleWrapper';
import {
    ChaynsApiDevice,
    ChaynsApiSite,
    ChaynsReactFunctions,
    ChaynsReactValues,
    UserInfo,
} from '../types/IChaynsReact';

/**
 * This adds a listener to determine your location.
 * @category Event listener
 */
export const addGeoLocationListener = (...args: Parameters<ChaynsReactFunctions["addGeoLocationListener"]>) => moduleWrapper.current.functions.addGeoLocationListener(...args);
/**
 * Adds a listener for scroll event by user.
 * @category Event listener
 */
export const addScrollListener = (...args: Parameters<ChaynsReactFunctions["addScrollListener"]>) => moduleWrapper.current.functions.addScrollListener(...args);
/**
 * This method will be executed when the page gets displayed or hidden.
 * @category Event listener
 */
export const addVisibilityChangeListener = (...args: Parameters<ChaynsReactFunctions["addVisibilityChangeListener"]>) => moduleWrapper.current.functions.addVisibilityChangeListener(...args);
/**
 * This method will be executed when the toolbar gets displayed or hidden.
 * @category Event listener
 */
export const addToolbarChangeListener = (...args: Parameters<ChaynsReactFunctions["addToolbarChangeListener"]>) => moduleWrapper.current.functions.addToolbarChangeListener(...args);

/**
 * This adds a listener to get the actual height of the page.
 * @category Event listener
 */
export const addWindowMetricsListener = (...args: Parameters<ChaynsReactFunctions["addWindowMetricsListener"]>) => moduleWrapper.current.functions.addWindowMetricsListener(...args);/**
 * Allows a custom callback function to be defined
 */
export const customCallbackFunction = (...args: Parameters<ChaynsReactFunctions["customCallbackFunction"]>) => moduleWrapper.current.functions.customCallbackFunction(...args);
/**
 * Get the accessToken from the user.
 */
export const getAccessToken = (...args: Parameters<ChaynsReactFunctions["getAccessToken"]>) => moduleWrapper.current.functions.getAccessToken(...args);
/**
 * This method returns a list of installed share/social media apps.
 */
export const getAvailableSharingServices = (...args: Parameters<ChaynsReactFunctions["getAvailableSharingServices"]>) => moduleWrapper.current.functions.getAvailableSharingServices(...args);
/**
 * This method determines your location. If you want to track a route, use addGeoLocationListener.
 */
export const getGeoLocation = (...args: Parameters<ChaynsReactFunctions["getGeoLocation"]>) => moduleWrapper.current.functions.getGeoLocation(...args);
/**
 * This method returns user information for a specific user.
 * @category User functions
 */
export const getUserInfo = (...args: Parameters<ChaynsReactFunctions["getUserInfo"]>) => moduleWrapper.current.functions.getUserInfo(...args);
/**
 * Return the current scroll position of the top frame
 */
export const getScrollPosition = (...args: Parameters<ChaynsReactFunctions["getScrollPosition"]>) => moduleWrapper.current.functions.getScrollPosition(...args);
/**
 * Returns the window metrics.
 */
export const getWindowMetrics = (...args: Parameters<ChaynsReactFunctions["getWindowMetrics"]>) => moduleWrapper.current.functions.getWindowMetrics(...args);
/** @internal */
export const invokeCall = (...args: Parameters<ChaynsReactFunctions["invokeCall"]>) => moduleWrapper.current.functions.invokeCall(...args);
/** @internal */
export const invokeDialogCall = (...args: Parameters<ChaynsReactFunctions["invokeDialogCall"]>) => moduleWrapper.current.functions.invokeDialogCall(...args);
/**
 * This method will show a login dialog where the user has the opportunity to log in.
 */
export const login = (...args: Parameters<ChaynsReactFunctions["login"]>) => moduleWrapper.current.functions.login(...args);
/**
 * This method will logout the user
 */
export const logout = (...args: Parameters<ChaynsReactFunctions["logout"]>) => moduleWrapper.current.functions.logout(...args);
/**
 * This function navigates you to the previous site.
 */
export const navigateBack = (...args: Parameters<ChaynsReactFunctions["navigateBack"]>) => moduleWrapper.current.functions.navigateBack(...args);
/**
 * The images specified in the url array is shown in gallery mode.
 */
export const openImage = (...args: Parameters<ChaynsReactFunctions["openImage"]>) => moduleWrapper.current.functions.openImage(...args);
/**
 * The images and videos specified in the items array is shown in gallery mode.
 */
export const openMedia = (...args: Parameters<ChaynsReactFunctions["openMedia"]>) => moduleWrapper.current.functions.openMedia(...args);
/**
 * Opens an URL in the chayns environment.
 */
export const openUrl = (...args: Parameters<ChaynsReactFunctions["openUrl"]>) => moduleWrapper.current.functions.openUrl(...args);
/**
 * The video specified in the URL is shown in video mode.
 */
export const openVideo = (...args: Parameters<ChaynsReactFunctions["openVideo"]>) => moduleWrapper.current.functions.openVideo(...args);
/**
 * Refresh badge count in navigation, user information and pages
 */
export const refreshData = (...args: Parameters<ChaynsReactFunctions["refreshData"]>) => moduleWrapper.current.functions.refreshData(...args);
/**
 * Refresh accesstoken, should only be used when user object changes, not when token is invalid
 */
export const refreshAccessToken = (...args: Parameters<ChaynsReactFunctions["refreshAccessToken"]>) => moduleWrapper.current.functions.refreshAccessToken(...args);
/**
 * This removes a listener to determine your location.
 * @category Event listener
 */
export const removeGeoLocationListener = (...args: Parameters<ChaynsReactFunctions["removeGeoLocationListener"]>) => moduleWrapper.current.functions.removeGeoLocationListener(...args);
/**
 * This removes a listener for changing toolbar visibility
 * @category Event listener
 */
export const removeToolbarChangeListener = (...args: Parameters<ChaynsReactFunctions["removeToolbarChangeListener"]>) => moduleWrapper.current.functions.removeToolbarChangeListener(...args);
/**
 * Removes scroll listener.
 * @category Event listener
 */
export const removeScrollListener = (...args: Parameters<ChaynsReactFunctions["removeScrollListener"]>) => moduleWrapper.current.functions.removeScrollListener(...args);
/**
 * Removes visibility change listener.
 * @category Event listener
 */
export const removeVisibilityChangeListener = (...args: Parameters<ChaynsReactFunctions["removeVisibilityChangeListener"]>) => moduleWrapper.current.functions.removeVisibilityChangeListener(...args);
/**
 * Removes window metrics listener.
 * @category Event listener
 */
export const removeWindowMetricsListener = (...args: Parameters<ChaynsReactFunctions["removeWindowMetricsListener"]>) => moduleWrapper.current.functions.removeWindowMetricsListener(...args);
/**
 * Select other page on chayns site.
 */
export const selectPage = (...args: Parameters<ChaynsReactFunctions["selectPage"]>) => moduleWrapper.current.functions.selectPage(...args);
/**
 * Scrolls by specific amount.
 */
export const scrollByY = (...args: Parameters<ChaynsReactFunctions["scrollByY"]>) => moduleWrapper.current.functions.scrollByY(...args);
/**
 * Scrolls to specific position.
 */
export const scrollToY = (...args: Parameters<ChaynsReactFunctions["scrollToY"]>) => moduleWrapper.current.functions.scrollToY(...args);
/**
 * Sends intercom message to group.
 */
export const sendMessageToGroup = (...args: Parameters<ChaynsReactFunctions["sendMessageToGroup"]>) => moduleWrapper.current.functions.sendMessageToGroup(...args);
/**
 * Sends intercom message to page.
 */
export const sendMessageToPage = (...args: Parameters<ChaynsReactFunctions["sendMessageToPage"]>) => moduleWrapper.current.functions.sendMessageToPage(...args);
/**
 * Sends intercom message to an user.
 */
export const sendMessageToUser = (...args: Parameters<ChaynsReactFunctions["sendMessageToUser"]>) => moduleWrapper.current.functions.sendMessageToUser(...args);
/**
 * Switches admin mode, also toggles admin switch in top frame.
 */
export const setAdminMode = (...args: Parameters<ChaynsReactFunctions["setAdminMode"]>) => moduleWrapper.current.functions.setAdminMode(...args);
/**
 * Sets the display timeout, only works in chayns App.
 */
export const setDisplayTimeout = (...args: Parameters<ChaynsReactFunctions["setDisplayTimeout"]>) => moduleWrapper.current.functions.setDisplayTimeout(...args);
/**
 * Enables or disables a button which floats over the page.
 */
export const setFloatingButton = (...args: Parameters<ChaynsReactFunctions["setFloatingButton"]>) => moduleWrapper.current.functions.setFloatingButton(...args);
/**
 * Sets the height of the page.
 */
export const setHeight = (...args: Parameters<ChaynsReactFunctions["setHeight"]>) => moduleWrapper.current.functions.setHeight(...args);
/**
 * Enables or disables the ability to refresh a page
 */
export const setRefreshScrollEnabled = (...args: Parameters<ChaynsReactFunctions["setRefreshScrollEnabled"]>) => moduleWrapper.current.functions.setRefreshScrollEnabled(...args);
/**
 * Scans a qr-code and returns the result
 */
export const setScanQrCode = (...args: Parameters<ChaynsReactFunctions["setScanQrCode"]>) => moduleWrapper.current.functions.setScanQrCode(...args);
/**
 * Temporarily change design settings in top frame
 */
export const setTempDesignSettings = (...args: Parameters<ChaynsReactFunctions["setTempDesignSettings"]>) => moduleWrapper.current.functions.setTempDesignSettings(...args);
/**
 * Shows or hide a waitcursor
 */
export const setWaitCursor = (...args: Parameters<ChaynsReactFunctions["setWaitCursor"]>) => moduleWrapper.current.functions.setWaitCursor(...args);
/**
 * Retrieves the value that is assigned to the key from a storage outside the frame
 */
export const storageGetItem = <T extends object | number | string>(...args: Parameters<ChaynsReactFunctions["storageGetItem"]>) => moduleWrapper.current.functions.storageGetItem<T>(...args);
/**
 * Removes the value that is assigned to the key from a storage outside the frame
 */
export const storageRemoveItem = (...args: Parameters<ChaynsReactFunctions["storageRemoveItem"]>) => moduleWrapper.current.functions.storageRemoveItem(...args);
/**
 * Sets the value that is assigned to the key from a storage outside the frame
 */
export const storageSetItem: ChaynsReactFunctions["storageSetItem"] = <T extends object | number | string>(...args: Parameters<ChaynsReactFunctions["storageSetItem"]>) => moduleWrapper.current.functions.storageSetItem(...args);
/**
 * This method lets a smartphone vibrate for the given time.
 */
export const vibrate = (...args: Parameters<ChaynsReactFunctions["vibrate"]>) => moduleWrapper.current.functions.vibrate(...args);

/**
 * This method creates a dialog
 */
// @ts-ignore
export const createDialog: ChaynsReactFunctions["createDialog"] = (config) => moduleWrapper.current.functions.createDialog(config);
/**
 * Displays an overlay
 */
export const setOverlay = (...args: Parameters<ChaynsReactFunctions["setOverlay"]>) => moduleWrapper.current.functions.setOverlay(...args);

/**
 * Generates a temp accesstoken, only valid for short period of time (~3 days), works only when no user is logged in
 */
export const addAnonymousAccount = () => moduleWrapper.current.functions.addAnonymousAccount();
/**
 * Returns user information, only when user is logged in
 * @category User functions
 */
export const getUser = () => moduleWrapper.current.values.user;
export const getSite = () => moduleWrapper.current.values.site;
export const getCurrentPage = () => moduleWrapper.current.values.currentPage;
export const getDevice = () => moduleWrapper.current.values.device;
export const getLanguage = () => moduleWrapper.current.values.language;
export const getParameters = () => moduleWrapper.current.values.parameters;
export const getPages = () => moduleWrapper.current.values.pages;
export const getEnvironment = () => moduleWrapper.current.values.environment;
export const getCustomFunction = (key: string) => moduleWrapper.current.customFunctions[key];


export const user = new Proxy<UserInfo>({ } as UserInfo, { get: (target, prop) => {console.warn('Deprecated user import'); return moduleWrapper.current.values.user?.[prop]} });
export const site = new Proxy<ChaynsApiSite>({ } as ChaynsApiSite, { get: (target, prop) => {console.warn('Deprecated site import'); return moduleWrapper.current.values.site?.[prop]} });
export const device = new Proxy<ChaynsApiDevice>({ } as ChaynsApiDevice, { get: (target, prop) => {console.warn('Deprecated device import'); return moduleWrapper.current.values.device?.[prop]} });
export const language = new Proxy<ChaynsReactValues["language"]>({ } as ChaynsReactValues["language"], { get: (target, prop) => {console.warn('Deprecated language import'); return moduleWrapper.current.values.language?.[prop]} });
export const parameters = new Proxy<ChaynsReactValues["parameters"]>({ } as ChaynsReactValues["parameters"], { get: (target, prop) => {console.warn('Deprecated parameters import'); return moduleWrapper.current.values.parameters?.[prop]} });
export const pages = new Proxy<ChaynsReactValues["pages"]>({ } as ChaynsReactValues["pages"], { get: (target, prop) => {console.warn('Deprecated pages import'); return moduleWrapper.current.values.pages?.[prop]} });
export const environment = new Proxy<ChaynsReactValues["environment"]>({ } as ChaynsReactValues["environment"], { get: (target, prop) => {console.warn('Deprecated environment import'); return moduleWrapper.current.values.environment?.[prop]} });
