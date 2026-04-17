import {AppFlavor} from "../../types/IChaynsReact";
import {getDevice, invokeCall} from "../../calls";
import type {RootState} from "../../types/history";
import {rootHistory} from "./rootHistory";


/** Prevent the browser from navigating away by cancelling the beforeunload event. */
export const beforeUnloadCallback = (event: BeforeUnloadEvent) => {
    event.stopPropagation();
    // Legacy support
    // eslint-disable-next-line no-param-reassign
    event.returnValue = true;
};

/**
 * Tracks whether the chayns app's native back-button handler is currently enabled.
 * `undefined` means the initial call has not been made yet.
 */
let isNativeHandlingActive: boolean | undefined;

/**
 * Synchronises the chayns app's native back-button handler with the current
 * history state.
 *
 * The native handler intercepts the device back button and calls our
 * `rootHistory.back()` instead of performing a full-page navigation.
 * It should be enabled whenever there is history to go back to (`index > 0`)
 * or when explicitly forced (e.g. a navigation block is active).
 *
 * Only runs inside the Chayns app flavour — other environments ignore this.
 */
export const updateNativeHandling = (force = false) => {
    if (getDevice().app?.flavor === AppFlavor.Chayns) {
        const index = (window.history.state as RootState)?.index;
        if ((isNativeHandlingActive === undefined || isNativeHandlingActive) && (index > 0 || force)) {
            void invokeCall({
                action: 249,
                value: {
                    enabled: true,
                },
            }, async () => {
                await rootHistory.back();
            });
            isNativeHandlingActive = false;
        } else if ((isNativeHandlingActive === undefined || !isNativeHandlingActive) && !index) {
            void invokeCall({
                action: 249,
                value: {
                    enabled: false,
                },
            });
            isNativeHandlingActive = true;
        }
    }
}




