import { ChaynsContext } from '../components/ChaynsContext';
import { useInternalContextSelector } from "./context";
/**
 * @category Hooks
 */
export const useIsAdminMode = (): boolean => useInternalContextSelector(ChaynsContext, v => v?.isAdminModeActive) ?? false
