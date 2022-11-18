import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsApiUser } from '../types/IChaynsReact';

/**
 * @category Hooks
 */
// @ts-ignore
export const useUser = (): ChaynsApiUser => useContextSelector(ChaynsContext, v => v?.user || {})
