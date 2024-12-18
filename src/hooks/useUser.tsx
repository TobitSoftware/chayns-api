import { useValuesSelector } from './context';

const empty = {}
/**
 * @category Hooks
 */
export const useUser = () => useValuesSelector(v => v.user ?? empty);
