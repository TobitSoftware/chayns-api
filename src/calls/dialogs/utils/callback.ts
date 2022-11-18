export function getCallbackName(fnName, framePrefix = '') {
    if (framePrefix !== '') {
        return `window._chaynsCallbacks.${framePrefix}.${fnName}`;
    }
    return `window._chaynsCallbacks.${fnName}`;
}
