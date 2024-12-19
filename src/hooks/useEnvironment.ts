import { ChaynsReactValues } from '../types/IChaynsReact';
import { useValuesSelector } from './context';
/**
 * @category Hooks
 */
export const useEnvironment = (): ChaynsReactValues["environment"] => useValuesSelector(v => v.environment)
