import { ChaynsContext } from '../components/ChaynsContext';
import { useInternalContextSelector } from "./context";

/**
 * @category Hooks
 */
export const useCustomData = <T extends any>(): T => useInternalContextSelector(ChaynsContext, v => v?.customData!)
