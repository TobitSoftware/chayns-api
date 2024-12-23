import React from 'react';
import ReactDOM from 'react-dom';
let ReactDOMClient;
try {
    ReactDOMClient = require('react-dom/client');
} catch (e) {
    // do nothing
}

export const initModuleFederationSharing = ({ name }) => {
    // forces single instance of module federation runtime
    if(globalThis.moduleFederationRuntime) {
        return;
    }

    globalThis.moduleFederationRuntime = require('@module-federation/enhanced/runtime');
    globalThis.moduleFederationScopes = {
        registeredScopes: {},
        moduleMap: {},
        componentMap: {},
    }

    const { init } = globalThis.moduleFederationRuntime;

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
            lib: () => ReactDOMClient
        }
    }

    init({
        name: name ?? '',
        remotes: [],
        shared,
    });
}
