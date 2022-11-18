import { useContextSelector } from 'use-context-selector';
import { ChaynsContext } from '../components/ChaynsContext';
import { ChaynsReactValues } from '../types/IChaynsReact';
/**
 * @category Hooks
 */
export const useValues = () => {
    const t = useContextSelector(ChaynsContext, v => v || {} as ChaynsReactValues)
    return t;
}
