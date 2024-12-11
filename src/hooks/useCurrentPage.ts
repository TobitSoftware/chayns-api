import { ChaynsContext } from '../components/ChaynsContext';
import { useInternalContextSelector } from "./context";

/**
 * @category Hooks
 */
export const useCurrentPage = () => useInternalContextSelector(ChaynsContext, v => v?.currentPage!)
