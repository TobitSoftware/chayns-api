import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues } from '../types/IChaynsReact';
import { useInternalContextSelector } from "./context";
/**
 * @category Hooks
 */
export const useLanguage = (): ChaynsReactValues["language"] => useInternalContextSelector(ChaynsContext, v => v?.language!)
