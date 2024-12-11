import { useCallback, useEffect, useRef, useState } from 'react';
import { ChaynsFunctionsContext } from '../components/ChaynsContext';
import { GeoLocation } from '../types/IChaynsReact';
import { useInternalContextSelector } from "./context";
/**
 * @category Hooks
 */
export const useGeoLocationListener = () => {
    const addListener = useInternalContextSelector(ChaynsFunctionsContext, v => v.addGeoLocationListener);
    const removeListener = useInternalContextSelector(ChaynsFunctionsContext, v => v.removeGeoLocationListener);
    const promiseRef = useRef<Promise<number>>();

    return useCallback(((value: { timeout?: number, silent?: boolean }, callback: (result: GeoLocation) => void) => {
        promiseRef.current = addListener(value, callback);

        return () => {
            void promiseRef.current?.then(removeListener);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), []);
};
/**
 * @category Hooks
 */
export const useGeoLocation = ({ enabled = true, timeout = 0, silent = false } = {}) => {
    const [value, setValue] = useState<GeoLocation | null>(null);
    const addListener = useGeoLocationListener();

    useEffect(() => {
        if (enabled) {
            return addListener({ timeout, silent }, setValue);
        }
        return undefined;
    }, [enabled, timeout, addListener, silent]);

    return { value };
};
