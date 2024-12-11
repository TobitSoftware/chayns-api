import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues } from '../types/IChaynsReact';
import { useInternalContextSelector } from "./context";
/**
 * @category Hooks
 */
export const useParameters = (): ChaynsReactValues['parameters'] => useInternalContextSelector(ChaynsContext, v => v?.parameters || [] as unknown as ChaynsReactValues['parameters'])
