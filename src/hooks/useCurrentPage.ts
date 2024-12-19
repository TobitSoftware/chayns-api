import { useValuesSelector } from './context';

/**
 * @category Hooks
 */
export const useCurrentPage = () => useValuesSelector(v => v.currentPage)
