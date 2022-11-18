import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues } from '../types/IChaynsReact';
/**
 * @category Hooks
 */
export const useParameters = (): ChaynsReactValues['parameters'] => useContextSelector(ChaynsContext, v => v?.parameters || [] as unknown as ChaynsReactValues['parameters'])
