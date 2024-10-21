import React from 'react';
import ReactDOM from 'react-dom';

export const initModuleFederationSharing = () => {
    // forces single instance of module federation runtime
    if (!globalThis.moduleFederationRuntime) {
        globalThis.moduleFederationRuntime = require('@module-federation/enhanced/runtime');
        globalThis.moduleFederationScopes = {
            registeredScopes: {},
            moduleMap: {},
            componentMap: {},
        }

        const { init } = globalThis.moduleFederationRuntime;

        // init also should only be called once
        init({
            // will be set by chayns-toolkit via DefinePlugin
            name: process.env.__PACKAGE_NAME__ ?? '',
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
    }
}
