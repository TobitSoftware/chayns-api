import { useContext, useMemo } from 'react';
import { ChaynsContext } from '../components/ChaynsContext';
import { BaseHistoryState, BlockCallback, IChaynsHistoryHandler } from '../types/history';

export type HistoryFunctions<State extends BaseHistoryState = BaseHistoryState> = {
    pushState: IChaynsHistoryHandler<State>['pushState'];
    replaceState: IChaynsHistoryHandler<State>['replaceState'];
    back: IChaynsHistoryHandler<State>['back'];
    forward: IChaynsHistoryHandler<State>['forward'];
    go: IChaynsHistoryHandler<State>['go'];
    block: (callback: BlockCallback) => () => void;
};

/**
 * Returns navigation functions (pushState, replaceState, back, forward, go, block) from the
 * current history handler. The returned object is stable as long as the history instance does not change.
 * @category Hooks
 */
export const useHistoryFunctions = <State extends BaseHistoryState = BaseHistoryState>(): HistoryFunctions<State> => {
    const store = useContext(ChaynsContext);

    if (!store) {
        throw new Error('Could not find chayns context. Did you forget to add ChaynsProvider?');
    }
    if (!store.history) {
        throw new Error('No history found in chayns context. Did you forget to provide a history?');
    }

    const history = store.history as IChaynsHistoryHandler<State>;

    return useMemo(
        () => ({
            pushState: history.pushState.bind(history),
            replaceState: history.replaceState.bind(history),
            back: history.back.bind(history),
            forward: history.forward.bind(history),
            go: history.go.bind(history),
            block: history.block.bind(history),
        }),
        [history],
    );
};
