import { useValuesSelector } from './context';

/**
 * @category Hooks
 */
export const useValues = () => useValuesSelector(v => v);
