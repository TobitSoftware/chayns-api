import { useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { ChaynsContext } from '../components/ChaynsContext';
import { IChaynsReact } from '../types/IChaynsReact';

export const useValuesSelector = <Result>(selector: (value: IChaynsReact["values"]) => Result) => {
    const store = useContext(ChaynsContext);

    if (!store) {
        throw new Error('Could not find chayns context. Did you forget to add ChaynsProvider?');
    }

    return useSyncExternalStore(store.subscribe, () => selector(store.values));
}

export const useFunctionsSelector = <Result>(selector: (value: IChaynsReact["functions"]) => Result) => {
    const store = useContext(ChaynsContext);

    if (!store) {
        throw new Error('Could not find chayns context. Did you forget to add ChaynsProvider?');
    }

    return useSyncExternalStore(store.subscribe, () => selector(store.functions));
}
