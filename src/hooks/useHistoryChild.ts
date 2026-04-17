import { useContext, useMemo } from 'react';
import { ChaynsContext } from '../components/ChaynsContext';
import { BaseHistoryState, IChaynsHistoryHandler } from '../types/history';

/**
 * Creates a child history handler for the given `id`, suitable for passing as the `history` prop
 * of a nested `ChaynsProvider`. The child is recreated if `id` or the parent history changes.
 * `initialState` is only used on first creation for a given `id`.
 * @category Hooks
 */
export const useHistoryChild = <ChildState extends BaseHistoryState = BaseHistoryState>(
    id: string | number,
    initialState: ChildState = {} as ChildState,
): IChaynsHistoryHandler<ChildState> => {
    const store = useContext(ChaynsContext);

    if (!store) {
        throw new Error('Could not find chayns context. Did you forget to add ChaynsProvider?');
    }
    if (!store.history) {
        throw new Error('No history found in chayns context. Did you forget to provide a history?');
    }

    const history = store.history;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => history.createChild<ChildState>(id, initialState), [history, id]);
};
