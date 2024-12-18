import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollListenerResult } from '../types/IChaynsReact';
import { useWindowMetrics } from './windowMetricsListener';
import { useFunctionsSelector } from './context';
/**
 * @category Hooks
 */
export const useScrollListener  = () => {
    const addListener = useFunctionsSelector(f => f.addScrollListener);
    const removeListener = useFunctionsSelector(f => f.removeScrollListener);
    const promiseRef = useRef<Promise<number>>();

    return useCallback(((value: { throttle?: number }, callback: (result: ScrollListenerResult) => void) => {
        promiseRef.current = addListener(value, callback);

        return () => {
            void promiseRef.current?.then(removeListener);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [])
}
/**
 * @category Hooks
 */
export const useScrollPosition = ({ enabled = true, throttle = 200 } = {}) => {
    const [value, setValue] = useState<ScrollListenerResult>({ scrollY: null, scrollX: null });
    const addListener = useScrollListener();
    const getScrollPosition = useFunctionsSelector(f => f.getScrollPosition);

    useEffect(() => {
        if (enabled) {
            return addListener({ throttle }, setValue);
        }
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, throttle, addListener]);

    useEffect(()=> {
        void getScrollPosition().then(setValue);
    }, [getScrollPosition])

    return value;
};
/**
 * @category Hooks
 */
export const useScrollOffsetTop = ({ enabled = true, throttle = 200 } = {}) => {
    const scrollPosition = useScrollPosition({ enabled, throttle });
    const { offsetTop, topBarHeight } = useWindowMetrics({ enabled });

    if (typeof scrollPosition?.scrollY === 'number') {
        return Math.max(0, scrollPosition.scrollY - (offsetTop - topBarHeight));
    }
    return 0;
}
/**
 * @category Hooks
 */
export const useScrollOffsetBottom = ({ enabled = true, throttle = 200 } = {}) => {
    const scrollPosition = useScrollPosition({ enabled, throttle });
    const { offsetTop, windowHeight, bottomBarHeight } = useWindowMetrics({ enabled });

    if (typeof scrollPosition?.scrollY === 'number') {
        return windowHeight - Math.max(0, offsetTop - scrollPosition.scrollY + bottomBarHeight);
    }
    return 0;
}
