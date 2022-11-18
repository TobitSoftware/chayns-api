import React, { FC } from 'react';
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

type ChaynsHostType =  {
    type: string,
    iFrameProps: { [key: string]: unknown, name: string },
    functions: ChaynsReactFunctions,
    src: string,
    iFrameRef: React.MutableRefObject<HTMLIFrameElement | null> | undefined,
    children?: JSX.Element,
    system: TypeSystem,
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
    environment: ChaynsReactValues["environment"]
}


const ChaynsHost: FC<ChaynsHostType> = ({
    type,
    iFrameProps,
    functions,
    src,
    iFrameRef = undefined,
    children = undefined,
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
    environment
}) => {
    switch (type) {
        case 'client-iframe':
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
                    src={src}
                    language={language}
                    parameters={parameters}
                    environment={environment}
                    customData={customData}
                />
            )
        case 'client-module':
            return (
                <ModuleHost
                    system={system}
                    pages={pages}
                    isAdminModeActive={isAdminModeActive}
                    site={site}
                    user={user}
                    device={device}
                    currentPage={currentPage}
                    functions={functions}
                    language={language}
                    parameters={parameters}
                    customData={customData}
                    environment={environment}
                />
            )
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
                    src={src}
                    postForm
                    language={language}
                    parameters={parameters}
                    environment={environment}
                    customData={customData}
                />
            )
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
                    functions={functions}
                    language={language}
                    parameters={parameters}
                    customData={customData}
                    environment={environment}
                >
                    {children}
                </ModuleHost>
            )
        default:
            return null;
    }
}

export default ChaynsHost;
