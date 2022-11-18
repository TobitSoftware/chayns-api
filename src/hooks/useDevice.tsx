import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsApiDevice } from '../types/IChaynsReact';
/**
 * @category Hooks
 */
export const useDevice = (): ChaynsApiDevice => useContextSelector(ChaynsContext, v => v?.device!)
