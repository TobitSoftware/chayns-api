import { AppleSafeArea, ChaynsReactFunctions } from '../types/IChaynsReact';

export interface AddAppleSafeAreaListenerOptions {
    callback: (safeArea: AppleSafeArea) => void;
    invokeCall: ChaynsReactFunctions['invokeCall'];
}

/**
 * Registers the native safe-area callback, preserving the complete result including optional
 * iPhone Duo hinge metadata. Callers must use the API listener registry to share this callback.
 * @internal
 */
export const addAppleSafeAreaListener = ({ callback, invokeCall }: AddAppleSafeAreaListenerOptions): void => {
    void invokeCall({ action: 300 }, (result: AppleSafeArea | { retVal?: AppleSafeArea } | undefined) => {
        const value = result && 'retVal' in result ? result.retVal : result;
        callback({ top: 0, left: 0, bottom: 0, right: 0, ...value });
    });
};
