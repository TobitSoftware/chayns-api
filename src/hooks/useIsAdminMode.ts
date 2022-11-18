import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
/**
 * @category Hooks
 */
export const useIsAdminMode = (): boolean => useContextSelector(ChaynsContext, v => v?.isAdminModeActive) ?? false
