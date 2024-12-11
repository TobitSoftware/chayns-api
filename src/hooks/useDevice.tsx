import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsApiDevice } from '../types/IChaynsReact';
import { useInternalContextSelector } from "./context";
/**
 * @category Hooks
 */
export const useDevice = (): ChaynsApiDevice => useInternalContextSelector(ChaynsContext, v => v?.device!)
