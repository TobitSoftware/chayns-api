import { useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { ChaynsContext } from '../components/ChaynsContext';
import { IChaynsReact } from '../types/IChaynsReact';

const useChaynsSelector = <T extends 'values' | 'functions' | 'customFunctions'>(key: T) => <Result>(selector: (value: IChaynsReact[T]) => Result): Result => {
    const store = useContext(ChaynsContext);

    if (!store) {
        throw new Error('Could not find chayns context. Did you forget to add ChaynsProvider?');
    }

    const getSnapshot = () => selector(store[key]);

    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export const useValuesSelector = useChaynsSelector('values');
export const useFunctionsSelector = useChaynsSelector('functions');
export const useCustomFunctionsSelector = useChaynsSelector('customFunctions');
