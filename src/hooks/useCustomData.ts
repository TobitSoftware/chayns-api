import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';

/**
 * @category Hooks
 */
export const useCustomData = <T extends any>(): T => useContextSelector(ChaynsContext, v => v?.customData!)
