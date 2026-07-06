import { invokeCall } from './index';
import { AppleSafeArea } from '../types/IChaynsReact';

export interface AddAppleSafeAreaListenerOptions {
    callback: (safeArea: AppleSafeArea) => void;
}

/**
 * Directly invokes the Apple Safe Area listener call.
 * This is used internally by the module wrapper.
 * 
 * @internal
 */
export const addAppleSafeAreaListener = ({ callback }: AddAppleSafeAreaListenerOptions) => {
    void invokeCall({ action: 300 }, callback);
};
