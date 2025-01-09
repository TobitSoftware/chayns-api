import { useFunctionsSelector } from './context';

/**
 * Returns customCallbackFunction
 * @category Hooks
 * @deprecated Use customFunction/useCustomFunction-interface instead if possible
 */
export const useCustomCallbackFunction = () => useFunctionsSelector((f) => f.customCallbackFunction);
