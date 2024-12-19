import { useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { ChaynsContext } from '../components/ChaynsContext';
import { IChaynsReact } from '../types/IChaynsReact';

export const useValuesSelector = <Result>(selector: (value: IChaynsReact["values"]) => Result) => {
    const store = useContext(ChaynsContext);

    if (!store) {
        throw new Error('Could not find chayns context. Did you forget to add ChaynsProvider?');
    }

    const getSnapshot = () => selector(store.values);

    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export const useFunctionsSelector = <Result>(selector: (value: IChaynsReact["functions"]) => Result) => {
    const store = useContext(ChaynsContext);

    if (!store) {
        throw new Error('Could not find chayns context. Did you forget to add ChaynsProvider?');
    }

    const getSnapshot = () => selector(store.functions);

    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
