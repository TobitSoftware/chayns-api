import { useValuesSelector } from './context';

/**
 * @category Hooks
 */
export const useCustomData = <T extends any>(): T => useValuesSelector(v => v.customData)
