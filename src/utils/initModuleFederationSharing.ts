import React from 'react';
import JSXRuntime from 'react/jsx-runtime';
import ReactDOM from 'react-dom';
import ReactDOMClient from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';
import injectExternalRuntimeCodePlugin from '@module-federation/inject-external-runtime-core-plugin';
import type { ModuleFederation, ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import { ManifestShareScopePlugin } from '../plugins/ManifestShareScopePlugin';
import { SequentialLoadPlugin } from '../plugins/SequentialLoadPlugin';

let ReactCompilerRuntime;
try {
    ReactCompilerRuntime = require('react/compiler-runtime');
} catch {
    ReactCompilerRuntime = null;
}

const ERROR_CACHE_TIME = 60000;

type LoadModule = (scope: string, module: string, url: string, preventSingleton?: boolean) => Promise<unknown>;

const normalizeUrl = (url: string) => {
    try {
        return new URL(url).toString();
    } catch {
        return url;
    }
};

const createLoadModule = (): LoadModule => async (scope, module, url, preventSingleton = false) => {
    const { loadRemote, registerRemotes } = globalThis.moduleFederationRuntime;
    const { registeredScopes, moduleMap, componentMap } = globalThis.moduleFederationScopes;
    const remoteUrl = normalizeUrl(url);

    if (registeredScopes[scope] !== remoteUrl || preventSingleton) {
        if (scope in registeredScopes) {
            console.error(`[chayns-api] call registerRemote with force for scope ${scope}. url: ${remoteUrl}`);
        }
        registerRemotes(
            [{ name: scope, entry: url }],
            { force: scope in registeredScopes || preventSingleton },
        );

        registeredScopes[scope] = remoteUrl;
        moduleMap[scope] = {};
        componentMap[scope] = {};
    }

    if (!(module in moduleMap[scope])) {
        const path = `${scope}/${module.replace(/^\.\//, '')}`;
        const promise = loadRemote(path);

        promise.catch((error) => {
            console.error('[chayns-api] Failed to load module', scope, remoteUrl, error);
            const key = `${scope}\n${module}\n${remoteUrl}`;
            const errorResetTimeouts = globalThis.moduleFederationScopes.errorResetTimeouts ?? new Set<string>();
            globalThis.moduleFederationScopes.errorResetTimeouts = errorResetTimeouts;

            if (errorResetTimeouts.has(key)) {
                return;
            }

            errorResetTimeouts.add(key);
            setTimeout(() => {
                if (registeredScopes[scope] === remoteUrl) {
                    registeredScopes[scope] = '';
                }
                errorResetTimeouts.delete(key);
            }, ERROR_CACHE_TIME);
        });

        moduleMap[scope][module] = promise;
    }

    return moduleMap[scope][module];
};

export const initModuleFederationSharing = ({
    scope,
    name,
    plugins = [],
}: {
    /**
     * Module Federation scope; should be identical to the package name in package.json, formatted in snake_case.
     */
    scope: string;
    /**
     * @deprecated use `scope` instead
     */
    name?: string;
    /**
     * Additional runtime plugins
     */
    plugins?: ModuleFederationRuntimePlugin[];
}) => {
    // forces single instance of module federation runtime
    if (globalThis.moduleFederationScopes) {
        return;
    }

    const { createInstance } = require('@module-federation/enhanced/runtime');

    const shared = {
        react: {
            version: React.version,
            scope: [`chayns-react-${React.version}`, 'chayns-api'],
            lib: () => React,
        },
        'react-dom': {
            version: React.version,
            scope: [`chayns-react-${React.version}`, 'chayns-api'],
            lib: () => ReactDOM,
        },
        'react-dom/client': {
            version: React.version,
            scope: [`chayns-react-${React.version}`, 'chayns-api'],
            lib: () => ReactDOMClient,
        },
        'react-dom/server': {
            version: React.version,
            scope: [`chayns-react-${React.version}`, 'chayns-api'],
            lib: () => ReactDOMServer,
        },
        'react/jsx-runtime': {
            version: React.version,
            scope: [`chayns-react-${React.version}`, 'chayns-api'],
            lib: () => JSXRuntime,
        },
    };
    if (ReactCompilerRuntime) {
        shared['react/compiler-runtime'] = {
            version: React.version,
            scope: [`chayns-react-${React.version}`, 'chayns-api'],
            lib: () => ReactCompilerRuntime,
        };
    }

    const instance: ModuleFederation = createInstance({
        name: scope ?? name ?? '',
        remotes: [],
        shared,
        plugins: [SequentialLoadPlugin(), ManifestShareScopePlugin(), injectExternalRuntimeCodePlugin(), ...plugins],
    });

    globalThis.moduleFederationRuntime = {
        loadModule: createLoadModule(),
        loadRemote: instance.loadRemote.bind(instance),
        registerRemotes: instance.registerRemotes.bind(instance),
        loadShareSync: instance.loadShareSync.bind(instance),
        getInstance: () => instance,
    };

    globalThis.moduleFederationScopes = {
        registeredScopes: {},
        moduleMap: {},
        componentMap: {},
        componentRegistrationKeys: {},
        errorResetTimeouts: new Set(),
    };
};
