import htmlEscape from 'htmlescape';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';
import { AppName, ChaynsReactFunctions, ChaynsReactValues, IChaynsReact } from '../types/IChaynsReact';
import getDeviceInfo from '../util/deviceHelper';
import { AppWrapper } from '../wrapper/AppWrapper';
import { FrameWrapper } from '../wrapper/FrameWrapper';
import { ModuleFederationWrapper } from '../wrapper/ModuleFederationWrapper';
import { SsrWrapper } from '../wrapper/SsrWrapper';
import { ChaynsContext } from './ChaynsContext';
import { addModuleWrapper, moduleWrapper, removeModuleWrapper } from './moduleWrapper';

const isServer = typeof window === 'undefined';

const InitialDataProvider = React.memo<{ data?: ChaynsReactValues, renderedByServer?: boolean }>(({ data, renderedByServer }) => {
    if (!renderedByServer) {
        return null;
    }
    return (
        <script id="__CHAYNS_DATA__" type="application/json" dangerouslySetInnerHTML={{ __html: htmlEscape(data || {}) }}/>
    );
}, () => true);

export type ChaynsProviderProps = {
    data?: ChaynsReactValues;
    functions?: ChaynsReactFunctions,
    customFunctions?: IChaynsReact["customFunctions"],
    renderedByServer?: boolean,
    isModule?: boolean,
    children?: ReactNode,
}

const ChaynsProvider: React.FC<ChaynsProviderProps> = ({
    children,
    data,
    functions,
    customFunctions,
    renderedByServer,
    isModule,
}) => {
    const customWrapper = useRef<IChaynsReact>(null!);

    if (!customWrapper.current) {
        if (isModule) {
            if (data && functions) {
                customWrapper.current = new ModuleFederationWrapper(data, functions, customFunctions);
            } else {
                console.warn('ModuleFederationWrapper requires data and functions');
            }
        } else if (isServer) {
            if (data && functions) {
                customWrapper.current = new SsrWrapper(data, functions, customFunctions);
            } else {
                console.warn('SsrWrapper requires data and functions');
            }
        } else {
            const deviceInfo = getDeviceInfo(navigator.userAgent, '');
            // load framewrapper in Chaynsweb in app (window.self === window.top)
            if([AppName.Chayns, AppName.ChaynsLauncher, AppName.Sidekick, AppName.TobitChat, AppName.Team, AppName.CityApp].includes(deviceInfo.app?.name ?? AppName.Unknown) && window.self === window.top) {
                customWrapper.current = new AppWrapper();
            } else {
                customWrapper.current = new FrameWrapper();
            }
        }
        moduleWrapper.current = customWrapper.current;
    }

    const [isInitialized, setIsInitialized] = useState<boolean>(!!customWrapper.current?.values);

    useEffect(() => {
        void (async () => {
            await customWrapper.current.init();
            customWrapper.current.addDataListener(({ type, value }) => {
                customWrapper.current.emitChange();
            });
            if (!isInitialized) {
                setIsInitialized(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (isModule && data) {
            customWrapper.current.values = data;
            customWrapper.current.emitChange();
        }
    }, [data, isModule]);

    useEffect(() => {
        if (isModule && customFunctions) {
            customWrapper.current.customFunctions = customFunctions;
            customWrapper.current.emitChange();
        }
    }, [customFunctions, isModule]);

    useIsomorphicLayoutEffect(() => {
        addModuleWrapper(customWrapper.current);
        return () => {
            removeModuleWrapper(customWrapper.current);
        };
    }, []);

    return (
        <>
            {isInitialized && (
                <ChaynsContext.Provider value={customWrapper.current}>
                    {children}
                </ChaynsContext.Provider>
            )}
            <InitialDataProvider data={customWrapper.current?.values} renderedByServer={renderedByServer}/>
        </>
    );
};

export default ChaynsProvider;
