import { ChaynsApiUser } from '../types/IChaynsReact';
import { useValuesSelector } from './context';

const empty = {} as ChaynsApiUser;
/**
 * @category Hooks
 */
export const useUser = (): ChaynsApiUser => useValuesSelector(v => v.user || empty);
