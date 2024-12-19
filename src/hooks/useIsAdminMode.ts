import { useValuesSelector } from './context';
/**
 * @category Hooks
 */
export const useIsAdminMode = (): boolean => useValuesSelector(v => v.isAdminModeActive ?? false);
