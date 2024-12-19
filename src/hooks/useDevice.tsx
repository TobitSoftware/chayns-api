import { ChaynsApiDevice } from '../types/IChaynsReact';
import { useValuesSelector } from "./context";
/**
 * @category Hooks
 */
export const useDevice = (): ChaynsApiDevice => useValuesSelector(v => v.device)
