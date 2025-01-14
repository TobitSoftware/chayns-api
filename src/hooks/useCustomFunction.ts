import { useCustomFunctionsSelector } from './context';

/**
 * Returns the customFunction
 * @category Hooks
 * @param key functionName
 */
export const useCustomFunction = <A extends Array<any>, T>(key: string) => useCustomFunctionsSelector<(...args: A) => Promise<T>>((customFunctions) => customFunctions[key]);
