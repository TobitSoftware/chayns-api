import React from 'react';
import JSXRuntime from 'react/jsx-runtime';
import ReactDOM from 'react-dom';
import ReactDOMClient from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';
import type { ModuleFederation, ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import { SequentialLoadPlugin } from '../plugins/SequentialLoadPlugin';

export const initModuleFederationSharing = ({ scope, name, plugins = [] }: {
    /**
     * Module Federation scope; should be identical to the package name in package.json, formatted in snake_case.
     */
    scope: string,
    /**
     * @deprecated use `scope` instead
     */
    name?: string,
    /**
     * Additional runtime plugins
     */
    plugins?: ModuleFederationRuntimePlugin[]
}) => {
    // forces single instance of module federation runtime
    if (globalThis.moduleFederationScopes) {
        return;
    }

    const { createInstance } = require('@module-federation/enhanced/runtime');

    const shared = {
        react: {
            version: React.version,
            scope: 'chayns-api',
            lib: () => React,
        },
        'react-dom': {
            version: React.version, // intended, because react dom.version is not identical to package json react version (hash in version)
            scope: 'chayns-api',
            lib: () => ReactDOM,
        },
        'react-dom/client': {
            version: React.version,
            scope: 'chayns-api',
            lib: () => ReactDOMClient,
        },
        'react-dom/server': {
            version: React.version,
            scope: 'chayns-api',
            lib: () => ReactDOMServer,
        },
        'react/jsx-runtime': {
            version: React.version,
            scope: 'chayns-api',
            lib: () => JSXRuntime,
        }
    };

    const instance: ModuleFederation = createInstance({
        name: scope ?? name ?? '',
        remotes: [],
        shared,
        plugins: [SequentialLoadPlugin(), ...plugins],
    });

    globalThis.moduleFederationRuntime = {
        loadRemote: instance.loadRemote.bind(instance),
        registerRemotes: instance.registerRemotes.bind(instance),
        loadShareSync: instance.loadShareSync.bind(instance),
        getInstance: () => instance,
    };

    globalThis.moduleFederationScopes = {
        registeredScopes: {},
        moduleMap: {},
        componentMap: {},
    };
};
