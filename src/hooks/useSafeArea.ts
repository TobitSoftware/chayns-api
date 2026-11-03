import { useCallback, useEffect, useState } from 'react';
import { AppleSafeArea, AppName } from '../types/IChaynsReact';
import { useFunctionsSelector, useValuesSelector } from './context';

/**
 * Configuration for which apps and versions support safe area functionality
 */
const SAFE_AREA_SUPPORT_CONFIG: Record<number, number> = {
    [AppName.Team]: 1072,
    [AppName.CityApp]: 7250,
    [AppName.Chayns]: 7250,
    [AppName.Sidekick]: 2120,
    [AppName.TobitChat]: 2077
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
 * Listens for safe-area and optional iPhone Duo hinge updates from the native app.
 * @category Hooks
 */
export const useSafeAreaListener = () => {
    const addListener = useFunctionsSelector(f => f.addAppleSafeAreaListener);
    const removeListener = useFunctionsSelector(f => f.removeAppleSafeAreaListener);

    return useCallback((callback: (result: AppleSafeArea) => void) => {
        const listenerId = addListener(callback);

        return () => {
            void listenerId.then(removeListener);
        };
    }, [addListener, removeListener]);
};

/**
 * Returns safe-area insets and optional iPhone Duo hinge metadata.
 * Hinge updates allow layouts to react when the device is opened or closed.
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
