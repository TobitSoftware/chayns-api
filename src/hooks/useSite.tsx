import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsApiSite } from '../types/IChaynsReact';
/**
 * @category Hooks
 */
export const useSite = (): ChaynsApiSite => useContextSelector(ChaynsContext, v => v?.site!)
