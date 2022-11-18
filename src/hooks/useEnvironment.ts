import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues } from '../types/IChaynsReact';
/**
 * @category Hooks
 */
export const useEnvironment = (): ChaynsReactValues["environment"] => useContextSelector(ChaynsContext, v => v?.environment!)
