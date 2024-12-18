import { ChaynsReactValues } from '../types/IChaynsReact';
import { useValuesSelector } from './context';
/**
 * @category Hooks
 */
export const useLanguage = (): ChaynsReactValues["language"] => useValuesSelector(v => v.language)
