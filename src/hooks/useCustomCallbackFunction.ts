import { useFunctionsSelector } from './context';

/**
 * @category Hooks
 * Returns customCallbackFunction
 * @deprecated Use customFunction/useCustomFunction-interface instead if possible
 */
export const useCustomCallbackFunction = () => useFunctionsSelector((f) => f.customCallbackFunction);
