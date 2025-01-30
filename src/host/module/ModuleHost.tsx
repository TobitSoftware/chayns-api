import React, { FC, ReactNode, useMemo } from 'react';
import loadComponent from './utils/loadComponent';
import {
    ChaynsApiDevice,
    ChaynsApiSite,
    ChaynsApiUser,
    ChaynsReactFunctions,
    ChaynsReactValues, IChaynsReact,
    Page,
} from '../../types/IChaynsReact';
import { replaceStagingUrl } from "../../util/url";

export type TypeSystem = {
    scope: string,
    url: string,
    serverUrl?: string,
    module: string,
    preventSingleton?: boolean
}

type SystemPropTypes = {
    fallback: ReactNode,
    [key: string]: any,
    system: TypeSystem
}

type ModulePropTypes = {
    system: TypeSystem,
    functions: ChaynsReactFunctions,
    customFunctions?: IChaynsReact["customFunctions"],
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
    children?: ReactNode,
    styleSettings: ChaynsReactValues["styleSettings"],
}

const System: FC<SystemPropTypes> = ({
    system,
    fallback,
    ...props
}) => {
    const Component = useMemo(() => loadComponent(system.scope, system.module, globalThis.window ? system.url : system.serverUrl, undefined, system.preventSingleton), [system.scope, system.module, system.url, system.serverUrl, system.preventSingleton]);

    return (
        <React.Suspense fallback={fallback || ''}>
            <Component {...props}/>
        </React.Suspense>
    );
}

const ModuleHost: FC<ModulePropTypes> = ({
    system,
    children = null,
    functions,
    customFunctions,
    // shallow data
    pages,
    isAdminModeActive,
    site,
    user,
    currentPage,
    device,
    language,
    parameters,
    customData,
    dialog,
    environment,
    preventStagingReplacement,
    styleSettings,
}) => {
    // region initialData
    const initialData = {
        site,
        isAdminModeActive,
        pages,
        currentPage,
        device,
        language,
        parameters,
        customData,
        environment,
        styleSettings,
    } as ChaynsReactValues;

    if (user) {
        initialData.user = user;
    }
    if (dialog) {
        initialData.dialog = dialog;
    }
    // endregion

    return (
        <>
            <div className="module-css"/>
            <System
                system={{
                    scope: system.scope,
                    url: replaceStagingUrl(preventStagingReplacement, system.url, environment.buildEnvironment),
                    serverUrl: replaceStagingUrl(preventStagingReplacement, system.serverUrl, environment.buildEnvironment),
                    module: system.module,
                    preventSingleton: system.preventSingleton
                }}
                data={initialData}
                functions={functions}
                customFunctions={customFunctions}
                fallback={children}
                isModule
            />
        </>
    )
}

export default ModuleHost;
