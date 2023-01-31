import React, { useMemo, FC, ReactNode } from 'react';
import useDynamicScript from './utils/useDynamicScript';
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
    module: string
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
    children?: ReactNode,
}

const System: FC<SystemPropTypes> = ({
    system,
    fallback,
    ...props
}) => {
    const {
        ready,
        failed
    } = useDynamicScript({
        url: system?.url,
        scope: system?.scope
    });

    const Component = useMemo(() => {
        // maybe return waitcursor instead
        if (!system || !ready || failed) {
            return null;
        }

        return React.lazy(loadComponent(system.scope, system.module, system.url));

        /* eslint-disable react-hooks/exhaustive-deps */
    }, [system?.scope, ready, system?.url]);

    return Component ? (
        <React.Suspense fallback={fallback || ''}>
            <Component {...props} />
        </React.Suspense>
    ) : (fallback as JSX.Element);
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
        environment
    } as ChaynsReactValues;

    if (user) {
        initialData.user = user;
    }
    // endregion

    return (
        <>
            <div className="module-css"/>
            <System
                system={{
                    scope: system.scope,
                    url: replaceStagingUrl(preventStagingReplacement, system.url, environment.runtimeEnvironment),
                    module: system.module
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
