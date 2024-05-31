import React, { FC, startTransition, useEffect, useState } from 'react';
import HostIframe from './iframe/HostIframe';
import ModuleHost, { TypeSystem } from './module/ModuleHost';
import {
    ChaynsApiDevice,
    ChaynsApiSite,
    ChaynsApiUser,
    ChaynsReactFunctions,
    ChaynsReactValues,
    Page
} from '../types/IChaynsReact';

type ChaynsHostType = {
    type: string,
    iFrameProps?: { [key: string]: unknown, name: string },
    functions: ChaynsReactFunctions,
    src?: string,
    iFrameRef?: React.MutableRefObject<HTMLIFrameElement | null> | undefined,
    loadingComponent?: JSX.Element,
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
}

const ChaynsHost: FC<ChaynsHostType> = ({
    type,
    iFrameProps,
    functions,
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
    dialog
}) => {
    const [isVisible, setIsVisible] = useState(type !== 'client-module' && (type !== 'server-module' || !!system?.serverUrl));

    useEffect(() => {
        if (isVisible) return;

        if (typeof startTransition === 'function') {
            startTransition(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(true);
        }
    }, []);

    if (!isVisible) {
        return null;
    }

    switch (type) {
        case 'client-iframe':
        case 'server-iframe':
            return (
                <HostIframe
                    iFrameRef={iFrameRef}
                    iFrameProps={iFrameProps!}
                    pages={pages}
                    isAdminModeActive={isAdminModeActive}
                    site={site}
                    user={user}
                    device={device}
                    currentPage={currentPage}
                    functions={functions}
                    src={src!}
                    postForm={type === 'server-iframe'}
                    language={language}
                    parameters={parameters}
                    environment={environment}
                    customData={customData}
                    preventStagingReplacement={preventStagingReplacement}
                    dialog={dialog}
                />
            )
        case 'client-module':
        case 'server-module':
            return (
                <ModuleHost
                    system={system!}
                    pages={pages}
                    isAdminModeActive={isAdminModeActive}
                    site={site}
                    user={user}
                    device={device}
                    currentPage={currentPage}
                    children={loadingComponent}
                    functions={functions}
                    language={language}
                    parameters={parameters}
                    customData={customData}
                    environment={environment}
                    preventStagingReplacement={preventStagingReplacement}
                    dialog={dialog}
                />
            );
        default:
            return null;
    }
}

export default ChaynsHost;
