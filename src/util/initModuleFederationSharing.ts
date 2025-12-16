import React from 'react';
import ReactDOM from 'react-dom';
import { SequentialLoadPlugin } from '../plugins/SequentialLoadPlugin';

let ReactDOMClient;
try {
    ReactDOMClient = require('react-dom/client');
} catch (e) {
    // do nothing
}

export const initModuleFederationSharing = ({ name, plugins = [] }) => {
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
    };
    if (ReactDOMClient) {
        shared['react-dom/client'] = {
            version: React.version,
            scope: 'chayns-api',
            lib: () => ReactDOMClient,
        };
    }

    globalThis.moduleFederationRuntime = createInstance({
        name: name ?? '',
        remotes: [],
        shared,
        plugins: [SequentialLoadPlugin(), ...plugins],
    });

    globalThis.moduleFederationScopes = {
        registeredScopes: {},
        moduleMap: {},
        componentMap: {},
    };
};
