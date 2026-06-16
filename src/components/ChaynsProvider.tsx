import htmlEscape from 'htmlescape';
import React, {ReactNode, useEffect, useRef, useState} from 'react';
import {useIsomorphicLayoutEffect} from '../hooks/useIsomorphicLayoutEffect';
import {AppName, ChaynsReactFunctions, ChaynsReactValues, IChaynsReact} from '../types/IChaynsReact';
import getDeviceInfo from '../utils/deviceHelper';
import {AppWrapper} from '../wrapper/AppWrapper';
import {FrameWrapper} from '../wrapper/FrameWrapper';
import {ModuleFederationWrapper} from '../wrapper/ModuleFederationWrapper';
import {SsrWrapper} from '../wrapper/SsrWrapper';
import {ChaynsContext} from './ChaynsContext';
import {addModuleWrapper, moduleWrapper, removeModuleWrapper} from './moduleWrapper';
import {ChaynsHistoryLayerProvider, useChaynsHistoryLayerContext} from '../contexts/HistoryLayerContext';
import {getOrInitRootChaynsHistoryLayer} from '../utils/history/rootLayer';
import type {ChaynsHistoryLayer} from '../types/history';

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
     * Explicit history layer to provide to the React subtree.
     * When set this layer is used directly and no root layer is auto-initialised.
     * Use this when the parent already owns a layer and wants to scope children to it.
     */
    historyLayer?: ChaynsHistoryLayer,
    /**
     * Initial history configuration for the root layer.
     * Ignored when `layer` is provided explicitly.
     * - `url`: Current page URL — browser defaults to `window.location.pathname`;
     *   for SSR pass the request URL (e.g. `req.url` or `router.asPath`).
     * - `segmentCount`: Number of URL path segments this application claims.
     *   E.g. `segmentCount: 2` on `/shop/products/detail` → `getLayer().getRoute()` → `['shop', 'products']`.
     */
    history?: { url?: string; segmentCount?: number },
    segmentCount?: number
    isHistoryDisabled?: boolean,
}

const ChaynsProvider: React.FC<ChaynsProviderProps> = ({
    children,
    data,
    functions,
    customFunctions,
    renderedByServer,
    isModule,
    chaynsApiId,
    historyLayer,
    history,
    isHistoryDisabled,
    segmentCount,
}) => {
    const customWrapper = useRef<IChaynsReact>(null!);
    const idRef = useRef(chaynsApiId ?? crypto?.randomUUID?.() ?? Math.random().toString());

    const contextLayer = useChaynsHistoryLayerContext();
    const parentLayerRef = useRef(contextLayer);
    const rootLayerRef = useRef<ChaynsHistoryLayer | null>(null);

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

    const [effectiveLayer, setEffectiveLayer] = useState<ChaynsHistoryLayer | null>(historyLayer ?? null)
    const [isInitialized, setIsInitialized] = useState<boolean>(!!customWrapper.current?.values);

    useEffect(() => {
        void (async () => {
            await customWrapper.current.init();
            customWrapper.current.addDataListener(({ type, value }) => {
                customWrapper.current.emitChange();
            });

            parentLayerRef.current = customWrapper.current.functions.getHistoryLayer() ?? contextLayer;

            // Only auto-init the root layer when no explicit historyLayer prop is given and there
            // is no parent layer already in context (e.g. from a wrapping ChaynsHost).
            if (!rootLayerRef.current && !historyLayer && !parentLayerRef.current) {
                rootLayerRef.current = getOrInitRootChaynsHistoryLayer(history?.url, history?.segmentCount).rootLayer;
            }

            const layer = historyLayer ?? parentLayerRef.current ?? rootLayerRef.current

            if(typeof segmentCount === 'number' && layer.getSegmentCount() !== segmentCount){
                layer.setSegmentCount(segmentCount)
            }

            setEffectiveLayer(layer)

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

    let isDisabled = Boolean(customWrapper.current.values?.isHistoryDisabled)

    if (typeof isHistoryDisabled === 'boolean' && !isDisabled) {
        isDisabled = isHistoryDisabled
    }

    if (historyLayer?.id === 'root') {
        isDisabled = false
    }

    return (
        <>
            {isInitialized && (
                <ChaynsContext.Provider value={customWrapper.current}>
                    {effectiveLayer && !isDisabled ? (
                        <ChaynsHistoryLayerProvider layer={effectiveLayer}>
                            {children}
                        </ChaynsHistoryLayerProvider>
                    ) : children}
                </ChaynsContext.Provider>
            )}
            <InitialDataProvider data={customWrapper.current?.values} renderedByServer={renderedByServer}/>
        </>
    );
};

export default ChaynsProvider;
