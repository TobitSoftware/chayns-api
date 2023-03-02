import { useContextSelector } from 'use-context-selector';
import { ChaynsFunctionsContext } from '../components/ChaynsContext';
import { ChaynsReactFunctions } from '../types/IChaynsReact';

export const useFunction = <T extends keyof ChaynsReactFunctions>(name: T): ChaynsReactFunctions[T] => {
    const t = useContextSelector(ChaynsFunctionsContext, f => f ? f[name] : null!)
    return t;
}
