import React from 'react';
import ReactDOM from 'react-dom';

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

    init({
        name: name ?? '',
        remotes: [],
        shared: {
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
        },
    });
}
