import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues } from '../types/IChaynsReact';
/**
 * @category Hooks
 */
export const useLanguage = (): ChaynsReactValues["language"] => useContextSelector(ChaynsContext, v => v?.language!)
