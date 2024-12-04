import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsApiUser } from '../types/IChaynsReact';


const empty = {}
/**
 * @category Hooks
 */
export const useUser = (): ChaynsApiUser => useContextSelector(ChaynsContext, v => v?.user || empty)
