import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues } from '../types/IChaynsReact';
import { useInternalContextSelector } from "./context";

/**
 * @category Hooks
 */
export const useValues = () => {
    return useInternalContextSelector(ChaynsContext, v => v || {} as ChaynsReactValues);
}
