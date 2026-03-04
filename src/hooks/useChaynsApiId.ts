import { useChaynsApiIdSelector } from './context';

/**
 * @category Hooks
 */
export const useChaynsApiId = (): string => {
    return useChaynsApiIdSelector((chaynsApiId) => chaynsApiId);
};
