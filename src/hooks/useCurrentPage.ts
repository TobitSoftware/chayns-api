import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';

/**
 * @category Hooks
 */
export const useCurrentPage = (): any => useContextSelector(ChaynsContext, v => v?.currentPage!)
