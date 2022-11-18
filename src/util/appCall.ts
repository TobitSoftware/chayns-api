// @ts-nocheck

const invokeAppCall = (call) => {
    call = JSON.stringify(call);
    if (window.webkit?.messageHandlers?.jsonCall) {
        window.webkit.messageHandlers.jsonCall.postMessage(call);
    } else if (window.chaynsApp?.jsonCall) {
        window.chaynsApp.jsonCall(call);
    } else if (window.chaynsElectron?.jsonCall) {
        window.chaynsElectron.jsonCall(call);
    } else {
        throw new Error('jsoncall interface not found');
    }
}
export default invokeAppCall;
