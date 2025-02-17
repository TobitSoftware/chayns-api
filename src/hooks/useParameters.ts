import { ChaynsReactValues } from '../types/IChaynsReact';
import { useValuesSelector } from './context';
/**
 * @category Hooks
 */
export const useParameters = (): ChaynsReactValues['parameters'] => useValuesSelector(v => v.parameters)
