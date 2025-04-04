import { useCallback, useEffect, useRef, useState } from 'react';
import { ScreenSize, WindowMetricsListenerResult } from '../types/IChaynsReact';
import { useFunctionsSelector } from './context';
/**
 * @category Hooks
 */
export const useWindowMetricsListener = () => {
    const addListener = useFunctionsSelector(f => f.addWindowMetricsListener);
    const removeListener = useFunctionsSelector(f => f.removeWindowMetricsListener);
    const promiseRef = useRef<Promise<number>>();

    return useCallback(((callback: (result: WindowMetricsListenerResult) => void) => {
        promiseRef.current = addListener(callback);

        return () => {
            void promiseRef.current?.then(removeListener);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [])
}
/**
 * @category Hooks
 */
export const useWindowMetrics = ({ enabled = true } = {}) => {
    const [value, setValue] = useState<WindowMetricsListenerResult>({
        bottomBarHeight: 0,
        offsetTop: 0,
        pageHeight: 0,
        pageWidth: 0,
        topBarHeight: 0,
        windowHeight: 0,
        pageSize: ScreenSize.XS
    });
    const addListener = useWindowMetricsListener();
    const getWindowMetrics = useFunctionsSelector(f => f.getWindowMetrics);

    useEffect(() => {
        if (enabled) {
            return addListener((v) => {
                setValue(v);
            });
        }
        return undefined;
    }, [enabled, addListener]);

    useEffect(()=> {
        void getWindowMetrics().then(setValue);
    }, [getWindowMetrics])

    return value;
};
