import { useContextSelector } from 'use-context-selector';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChaynsFunctionsContext } from '../components/ChaynsContext';
import { ScreenSize, WindowMetricsListenerResult } from '../types/IChaynsReact';
/**
 * @category Hooks
 */
export const useWindowMetricsListener = () => {
    const addListener = useContextSelector(ChaynsFunctionsContext, v => v.addWindowMetricsListener);
    const removeListener = useContextSelector(ChaynsFunctionsContext, v => v.removeWindowMetricsListener);
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
    const getWindowMetrics = useContextSelector(ChaynsFunctionsContext, v => v.getWindowMetrics);

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
