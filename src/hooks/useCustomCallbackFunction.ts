import { useFunctions } from './useFunctions';

/**
 * @category Hooks
 * Returns customCallbackFunction
 */
export const useCustomCallbackFunction = () => {
    const { customCallbackFunction } = useFunctions();
    return customCallbackFunction;
}
