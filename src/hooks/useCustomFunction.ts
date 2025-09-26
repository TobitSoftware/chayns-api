import { useCustomFunctionsSelector } from './context';

/**
 * Returns the customFunction
 * @category Hooks
 * @param key functionName
 */
export const useCustomFunction = <A extends (...args: any[]) => Promise<any>>(key: string) => useCustomFunctionsSelector<A>((customFunctions) => customFunctions[key] as A);
