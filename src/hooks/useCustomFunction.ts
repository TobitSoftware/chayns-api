import { useCustomFunctionsSelector } from './context';

export const useCustomFunction = (key: string) => useCustomFunctionsSelector((customFunctions) => customFunctions[key]);
