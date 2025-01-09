import { useCustomFunctionsSelector } from './context';

export const useCustomFunction = <A extends Array<any>, T>(key: string) => useCustomFunctionsSelector<(...args: A) => Promise<T>>((customFunctions) => customFunctions[key]);
