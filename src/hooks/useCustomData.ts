import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';

/**
 * @category Hooks
 */
export const useCustomData = (): any => useContextSelector(ChaynsContext, v => v?.customData!)
