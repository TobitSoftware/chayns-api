import { useFunctionsSelector } from './context';

/**
 * @category Hooks
 */
export const useFunctions = () => useFunctionsSelector((f) => f);
