import React, { FC, useDeferredValue, useSyncExternalStore } from 'react';
import HostIframe from './iframe/HostIframe';
import ModuleHost, {TypeSystem} from './module/ModuleHost';
import {
    ChaynsApiDevice,
    ChaynsApiSite,
    ChaynsApiUser,
    ChaynsReactFunctions,
    ChaynsReactValues,
    IChaynsReact,
    Page,
} from '../types/IChaynsReact';
import {ChaynsHistoryLayer} from '../types/history';
import {ChaynsHistoryLayerProvider} from '../contexts/HistoryLayerContext';
import {getOrInitRootChaynsHistoryLayer} from '../utils/history/rootLayer';

type ChaynsHostType = {
    type: `${'client' | 'server'}-${'iframe' | 'module'}`,
    iFrameProps?: { [key: string]: unknown, name: string },
    functions: ChaynsReactFunctions,
    customFunctions?: IChaynsReact["customFunctions"],
    src?: string,
    iFrameRef?: React.MutableRefObject<HTMLIFrameElement | null> | undefined,
    loadingComponent?: React.ReactNode,
    system?: TypeSystem,
    // shallow data
    pages: Page[],
    isAdminModeActive: boolean,
    site: ChaynsApiSite,
    user: ChaynsApiUser | undefined,
    currentPage: ChaynsReactValues["currentPage"],
    device: ChaynsApiDevice,
    language: ChaynsReactValues["language"],
    parameters: ChaynsReactValues["parameters"],
    customData: any,
    environment: ChaynsReactValues["environment"],
    preventStagingReplacement?: boolean,
    dialog: ChaynsReactValues["dialog"],
    styleSettings?: ChaynsReactValues["styleSettings"],
    /** History layer to provide to hosted children. Defaults to the root layer. */
    historyLayer?: ChaynsHistoryLayer,
    /**
     * ID for this module's dedicated child history layer.
     * When set, a child layer with this ID is created (or reused) from the parent
     * `historyLayer` and passed to the module — giving the module its own routing
     * namespace. Activate it with `layer.navigate({ activeChild: historyChildId })`.
     */
    historyChildId?: string,
    /** When true, enables the history layer for hosted children. Defaults to false. */
    isHistoryEnabled?: boolean,
} & ({
    type: `${'client' | 'server'}-iframe`,
    src: string,
    iFrameProps: { [key: string]: unknown, name: string },
} | {
    type: `${'client' | 'server'}-module`,
    system: TypeSystem,
});

const subscribeToHydration = () => () => {};

const ChaynsHost: FC<ChaynsHostType> = ({
    type,
    iFrameProps,
    functions,
    customFunctions,
    src,
    iFrameRef = undefined,
    loadingComponent = undefined,
    system,
    // shallow data
    pages,
    language,
    isAdminModeActive,
    site,
    user,
    currentPage,
    device,
    parameters,
    customData,
    environment,
    preventStagingReplacement,
    dialog,
    styleSettings,
    historyLayer,
    historyChildId,
    isHistoryEnabled = false,
}) => {
    const isInitiallyVisible = type !== 'client-module' && (type !== 'server-module' || !!system?.serverUrl);
    const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
    const isVisible = useDeferredValue(isInitiallyVisible || isHydrated);

    if (!isVisible) {
        return null;
    }

    const resolvedLayer = historyLayer ?? getOrInitRootChaynsHistoryLayer().rootLayer;

    let layer: ChaynsHistoryLayer | undefined;

    if (isHistoryEnabled) {
        layer = historyChildId
            ? (resolvedLayer.getChildLayer(historyChildId) ?? resolvedLayer.createChildLayer(historyChildId))
            : resolvedLayer;
    }

    switch (type) {
        case 'client-iframe':
        case 'server-iframe':
            return (
                <ChaynsHistoryLayerProvider layer={resolvedLayer}>
                    <HostIframe
                        iFrameRef={iFrameRef}
                        iFrameProps={iFrameProps}
                        pages={pages}
                        isAdminModeActive={isAdminModeActive}
                        site={site}
                        user={user}
                        device={device}
                        currentPage={currentPage}
                        functions={functions}
                        customFunctions={customFunctions}
                        src={src}
                        postForm={type === 'server-iframe'}
                        language={language}
                        parameters={parameters}
                        environment={environment}
                        customData={customData}
                        preventStagingReplacement={preventStagingReplacement}
                        dialog={dialog}
                        styleSettings={styleSettings}
                        historyLayer={layer}
                        isHistoryEnabled={isHistoryEnabled}
                    />
                </ChaynsHistoryLayerProvider>
            )
        case 'client-module':
        case 'server-module': {
            return (
                <ChaynsHistoryLayerProvider layer={resolvedLayer}>
                    <ModuleHost
                        system={system}
                        pages={pages}
                        isAdminModeActive={isAdminModeActive}
                        site={site}
                        user={user}
                        device={device}
                        currentPage={currentPage}
                        children={loadingComponent}
                        functions={functions}
                        customFunctions={customFunctions}
                        language={language}
                        parameters={parameters}
                        customData={customData}
                        environment={environment}
                        preventStagingReplacement={preventStagingReplacement}
                        dialog={dialog}
                        styleSettings={styleSettings}
                        historyLayer={layer}
                        isHistoryEnabled={isHistoryEnabled}
                    />
                </ChaynsHistoryLayerProvider>
            );
        }
        default:
            return null;
    }
}

export default ChaynsHost;
