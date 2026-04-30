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
import { addModuleWrapper, chaynsApis, moduleWrapper, removeModuleWrapper } from './moduleWrapper';
import { HistoryLayerProvider, useHistoryLayerContext } from '../handler/history/react/HistoryLayerContext';
import { getOrInitRootLayer } from '../handler/history/initRootLayer';
import type { HistoryLayer } from '../handler/history/types';

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
    chaynsApiId?: string,
    /**
     * Initial history configuration for the root layer.
     * - `url`: Current page URL — browser defaults to `window.location.pathname`;
     *   for SSR pass the request URL (e.g. `req.url` or `router.asPath`).
     * - `segmentCount`: Number of URL path segments this application claims.
     *   E.g. `segmentCount: 2` on `/shop/products/detail` → `getLayer().getRoute()` → `['shop', 'products']`.
     */
    history?: { url?: string; segmentCount?: number },
}

const ChaynsProvider: React.FC<ChaynsProviderProps> = ({
    children,
    data,
    functions,
    customFunctions,
    renderedByServer,
    isModule,
    chaynsApiId,
    history,
}) => {
    const customWrapper = useRef<IChaynsReact>(null!);
    const idRef = useRef(chaynsApiId ?? crypto?.randomUUID() ?? Math.random().toString());

    // Only inject root history layer when there is no parent layer (e.g. we are not
    // inside a ChaynsHost that already provides a specific child layer).
    const parentLayer = useHistoryLayerContext();
    const rootLayerRef = useRef<HistoryLayer | null>(null);
    if (!rootLayerRef.current && !parentLayer) {
        rootLayerRef.current = getOrInitRootLayer(history?.url).rootLayer;
        if (history?.segmentCount !== undefined) {
            rootLayerRef.current.setSegmentCount(history.segmentCount);
        }
    }

    if (!customWrapper.current) {
        if (isModule) {
            if (data && functions) {
                customWrapper.current = new ModuleFederationWrapper(data, functions, customFunctions);
            } else {
                console.error('[chayns-api] ModuleFederationWrapper requires data and functions');
            }
        } else if (isServer) {
            if (data && functions) {
                customWrapper.current = new SsrWrapper(data, functions, customFunctions);
            } else {
                console.error('[chayns-api] SsrWrapper requires data and functions');
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
        if (customWrapper.current) {
            customWrapper.current.chaynsApiId = idRef.current;
        }
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
        const id = idRef.current;
        addModuleWrapper(id, customWrapper.current);
        return () => {
            removeModuleWrapper(id, customWrapper.current);
        };
    }, []);

    return (
        <>
            {isInitialized && (
                <ChaynsContext.Provider value={customWrapper.current}>
                    {rootLayerRef.current ? (
                        <HistoryLayerProvider layer={rootLayerRef.current}>
                            {children}
                        </HistoryLayerProvider>
                    ) : children}
                </ChaynsContext.Provider>
            )}
            <InitialDataProvider data={customWrapper.current?.values} renderedByServer={renderedByServer}/>
        </>
    );
};

export default ChaynsProvider;
