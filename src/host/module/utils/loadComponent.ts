import { Shared } from '@module-federation/runtime/dist/src/type';
import ReactDOM from 'react-dom';
import semver from 'semver';
import React from 'react';

// forces single instance of module federation runtime
if (!globalThis.moduleFederationRuntime) {
    globalThis.moduleFederationRuntime = require('@module-federation/runtime');

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
const { loadRemote, registerRemotes, loadShareSync } = globalThis.moduleFederationRuntime;

const registeredScopes = {};
const moduleMap = {};
const componentMap = {}

export const loadModule = (scope, module, url, preventSingleton = false) => {
    if (registeredScopes[scope] !== url || preventSingleton) {
        if (scope in registeredScopes) {
            console.error(`[chayns-api] call registerRemote with force for scope ${scope}. url: ${url}`);
        }
        registerRemotes([
            {
                name: scope,
                entry: url,
                alias: scope,
            }
        ], { force: (scope in registeredScopes) || preventSingleton });

        registeredScopes[scope] = url;
        moduleMap[scope] = {};
        componentMap[scope] = {};
    }

    if (!(module in moduleMap[scope])) {
        const path = `${scope}/${module.replace(/^\.\//, '')}`;

        const promise =  loadRemote(path);

        promise.catch((e) => {
            console.error("[chayns-api] Failed to load module", scope, url, e);
            // causes registerRemote with force = true on next attempt to load the component which tries to load the component again
            registeredScopes[scope] = '';
        });

        return promise;
    }
    return moduleMap[scope][module];
}

const loadComponent = (scope, module, url, skipCompatMode = false, preventSingleton = false) => {
    if (skipCompatMode) {
        console.warn('[chayns-api] skipCompatMode-option is deprecated and is set automatically now');
    }

    if (!componentMap[scope]) {
        componentMap[scope] = {};
    }

    if (!(module in componentMap[scope])) {
        const promise = loadModule(scope, module, url, preventSingleton).then(async (Module: any) => {
            if (typeof Module.default === 'function') {
                return Module;
            }
            const hostVersion = semver.minVersion(React.version)!;
            const { requiredVersion, environment } = Module.default;

            const shareScopes = await new Promise<Shared[]>(resolve => {
                loadShareSync('react', {
                    resolver: (shareOptions) => {
                        resolve(shareOptions);
                        return shareOptions[0];
                    },
                });
            });
            const matchReactVersion = requiredVersion && semver.satisfies(hostVersion, requiredVersion) && !shareScopes.some(({ version, from }) => {
                return (semver.gt(version, hostVersion) && semver.satisfies(version, requiredVersion)) || scope === from.split('-').join('_');
            })

            if (!matchReactVersion || environment !== 'production' || process.env.NODE_ENV === 'development') {
                return { default: Module.default.CompatComponent };
            }
            return { default: Module.default.Component };
        });

        promise.catch((e) => {
            console.error("[chayns-api] Failed to load component", scope, url, e);
            delete componentMap[scope][module]
        });

        componentMap[scope][module] = React.lazy(() => promise);
    }
    return componentMap[scope][module];
}

export default loadComponent;
