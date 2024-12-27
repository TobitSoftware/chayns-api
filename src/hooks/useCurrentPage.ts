import { ChaynsReactValues } from '../types/IChaynsReact';
import { useValuesSelector } from './context';

/**
 * @category Hooks
 */
export const useCurrentPage = (): ChaynsReactValues["currentPage"] => useValuesSelector(v => v.currentPage)
