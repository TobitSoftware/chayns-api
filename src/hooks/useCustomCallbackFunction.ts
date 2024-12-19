import { useFunctionsSelector } from './context';

/**
 * @category Hooks
 * Returns customCallbackFunction
 */
export const useCustomCallbackFunction = () => useFunctionsSelector((f) => f.customCallbackFunction);
