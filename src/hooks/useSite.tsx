import { ChaynsApiSite } from '../types/IChaynsReact';
import { useValuesSelector } from './context';
/**
 * @category Hooks
 */
export const useSite = (): ChaynsApiSite => useValuesSelector(v => v.site);
