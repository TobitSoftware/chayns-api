import React, { FC, ReactNode, useContext, useMemo } from 'react';
import { ModuleContext } from '../../constants/moduleContext';
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
    const Component = useMemo(() => loadComponent(system.scope, system.module, globalThis.window ? system.url : system.serverUrl as string, undefined, system.preventSingleton), [system.scope, system.module, system.url, system.serverUrl, system.preventSingleton]);
    if (!globalThis.window) {
        const moduleContext = useContext(ModuleContext);
        moduleContext[system.scope] ??= {
            url: system.url,
            modules: new Set(),
        };
        moduleContext[system.scope].modules.add(system.module);
    }

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
    const data = useMemo(() => {
        const result = {
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
            result.user = user;
        }
        if (dialog) {
            result.dialog = dialog;
        }
        return result;
    }, [site, isAdminModeActive, pages, currentPage, device, language, parameters, customData, environment, styleSettings, user, dialog]);

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
                data={data}
                functions={functions}
                customFunctions={customFunctions}
                fallback={children}
                isModule
            />
        </>
    )
}

export default ModuleHost;
