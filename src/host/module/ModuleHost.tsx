import { init } from '@module-federation/runtime';
import React, { FC, ReactNode, useMemo } from 'react';
import ReactDOM from 'react-dom';
import loadComponent from './utils/loadComponent';
import {
    ChaynsApiDevice,
    ChaynsApiSite,
    ChaynsApiUser,
    ChaynsReactFunctions,
    ChaynsReactValues,
    Page
} from '../../types/IChaynsReact';
import { replaceStagingUrl } from "../../util/url";

export type TypeSystem = {
    scope: string,
    url: string,
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
}


init({
    // @ts-expect-error will be set by chayns-toolkit via DefinePlugin
    name: process.env.__PACKAGE_NAME__,
    remotes: [],
    shared: {
        react: {
            version: React.version,
            scope: 'default',
            lib: () => React,
        },
        'react-dom': {
            version: ReactDOM.version,
            scope: 'default',
            lib: () => ReactDOM,
        },
    },
});

const System: FC<SystemPropTypes> = ({
    system,
    fallback,
    ...props
}) => {
    const Component = useMemo(() => loadComponent(system.scope, system.module, system.url, undefined, system.preventSingleton), [system.scope, system.module, system.url, system.preventSingleton]);

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
    preventStagingReplacement
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
                    module: system.module,
                    preventSingleton: system.preventSingleton
                }}
                data={initialData}
                functions={functions}
                fallback={children}
                isModule
            />
        </>
    )
}

export default ModuleHost;
