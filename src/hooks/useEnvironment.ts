import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues } from '../types/IChaynsReact';
import { useInternalContextSelector } from "./context";
/**
 * @category Hooks
 */
export const useEnvironment = (): ChaynsReactValues["environment"] => useInternalContextSelector(ChaynsContext, v => v?.environment!)
