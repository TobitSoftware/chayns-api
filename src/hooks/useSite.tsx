import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsApiSite } from '../types/IChaynsReact';
import { useInternalContextSelector } from "./context";
/**
 * @category Hooks
 */
export const useSite = (): ChaynsApiSite => useInternalContextSelector(ChaynsContext, v => v?.site!)
