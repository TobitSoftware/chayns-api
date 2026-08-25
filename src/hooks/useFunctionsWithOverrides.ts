import { useEffect, useMemo, useRef } from 'react';
import { ChaynsReactFunctions } from '../types/IChaynsReact';
import { useFunctions } from './useFunctions';

type FunctionsOverrideFactory = (base: ChaynsReactFunctions) => Partial<ChaynsReactFunctions>;
type FunctionImplementation = (...args: never[]) => unknown;

type FunctionsState = {
    base: ChaynsReactFunctions;
    overrides: Partial<ChaynsReactFunctions>;
};

export const useFunctionsWithOverrides = (
    overrideFactory: FunctionsOverrideFactory,
): ChaynsReactFunctions => {
    const base = useFunctions();
    const overrides = useMemo(() => overrideFactory(base), [base, overrideFactory]);
    const stateRef = useRef<FunctionsState>({ base, overrides });

    useEffect(() => {
        stateRef.current = { base, overrides };
    }, [base, overrides]);

    return useMemo(() => {
        const functions: Record<string, FunctionImplementation> = {};

        for (const key of Object.keys(base)) {
            functions[key] = (...args) => {
                const functionKey = key as keyof ChaynsReactFunctions;
                const implementation = stateRef.current.overrides[functionKey] ?? stateRef.current.base[functionKey];
                return (implementation as FunctionImplementation)(...args);
            };
        }

        return functions as unknown as ChaynsReactFunctions;
    }, [base]);
};
