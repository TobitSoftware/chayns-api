import { useMemo } from 'react';
import { ChaynsReactValues } from '../types/IChaynsReact';
import { useValues } from './useValues';

export const useValuesWithOverrides = (
    overrideFactory: (base: ChaynsReactValues) => Partial<ChaynsReactValues>,
): ChaynsReactValues => {
    const base = useValues();
    const overrides = useMemo(() => overrideFactory(base), [base, overrideFactory]);
    return useMemo(() => ({ ...base, ...overrides }), [base, overrides]);
};
