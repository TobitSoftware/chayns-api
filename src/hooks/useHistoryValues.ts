import { useContext, useEffect, useState } from 'react';
import { ChaynsContext } from '../components/ChaynsContext';
import { BaseHistoryState, IChaynsHistoryHandler } from '../types/history';

/**
 * Returns the current history location and state, and re-renders whenever navigation occurs.
 * @category Hooks
 */
export const useHistoryValues = <State extends BaseHistoryState = BaseHistoryState>(): {
    location: string;
    state: State | undefined;
} => {
    const store = useContext(ChaynsContext);

    if (!store) {
        throw new Error('Could not find chayns context. Did you forget to add ChaynsProvider?');
    }
    if (!store.history) {
        throw new Error('No history found in chayns context. Did you forget to provide a history?');
    }

    const history = store.history as IChaynsHistoryHandler<State>;

    const [values, setValues] = useState<{ location: string; state: State | undefined }>(() => ({
        location: history.getLocation(),
        state: history.getState(),
    }));

    useEffect(() => {
        // Re-sync in case navigation happened between render and effect.
        setValues({ location: history.getLocation(), state: history.getState() });

        return history.addChangeListener(() => {
            setValues({ location: history.getLocation(), state: history.getState() });
        });
    }, [history]);

    return values;
};
