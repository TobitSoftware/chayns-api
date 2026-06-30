import { useCallback, useEffect, useRef, useState } from 'react';
import { AppleSafeArea, AppName } from '../types/IChaynsReact';
import { useFunctionsSelector, useValuesSelector } from './context';

/**
 * Configuration for which apps and versions support safe area functionality
 */
const SAFE_AREA_SUPPORT_CONFIG: Record<number, number> = {
    [AppName.Team]: 1072,
};

/**
 * Checks if the current device supports safe area functionality
 */
const isSafeAreaSupported = (os: string | null | undefined, app: any | undefined): boolean => {
    if (!os || !['iOS', 'Mac OS'].includes(os)) {
        return false;
    }

    if (!app) {
        return false;
    }

    const minVersion = SAFE_AREA_SUPPORT_CONFIG[app.name as AppName] ?? null;

    if (minVersion === null) {
        return false;
    }

    return app.appVersion >= minVersion;
};

/**
 * @category Hooks
 */
export const useSafeAreaListener = () => {
    const addListener = useFunctionsSelector(f => f.addAppleSafeAreaListener);
    const removeListener = useFunctionsSelector(f => f.removeAppleSafeAreaListener);
    const promiseRef = useRef<Promise<number>>();

    return useCallback(((callback: (result: AppleSafeArea) => void) => {
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
export const useSafeArea = ({ enabled = true } = {}) => {
    const [value, setValue] = useState<AppleSafeArea>({
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    });
    const addListener = useSafeAreaListener();
    const device = useValuesSelector(v => v.device);

    const isSupported = isSafeAreaSupported(device.os, device.app);

    useEffect(() => {
        if (enabled && isSupported) {
            return addListener((v) => {
                setValue(v);
            });
        }
        return undefined;
    }, [enabled, isSupported, addListener]);

    return value;
};
