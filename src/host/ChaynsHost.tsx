import React, { FC, useDeferredValue, useSyncExternalStore } from 'react';
import HostIframe from './iframe/HostIframe';
import ModuleHost, { TypeSystem } from './module/ModuleHost';
import {
    ChaynsApiDevice,
    ChaynsApiSite,
    ChaynsApiUser,
    ChaynsReactFunctions,
    ChaynsReactValues,
    IChaynsReact,
    Page,
} from '../types/IChaynsReact';

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
}) => {
    const isInitiallyVisible = type !== 'client-module' && (type !== 'server-module' || !!system?.serverUrl);
    const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
    const isVisible = useDeferredValue(isInitiallyVisible || isHydrated);

    if (!isVisible) {
        return null;
    }

    switch (type) {
        case 'client-iframe':
        case 'server-iframe':
            return (
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
                />
            )
        case 'client-module':
        case 'server-module':
            return (
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
                />
            );
        default:
            return null;
    }
}

export default ChaynsHost;
