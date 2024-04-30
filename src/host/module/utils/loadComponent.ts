import { Shared } from '@module-federation/runtime/dist/src/type';
import ReactDOM from 'react-dom';
import semver from 'semver';
import React from 'react';
import { loadRemote, registerRemotes, loadShareSync, init } from '@module-federation/runtime';

const registeredScopes = {};
const moduleMap = {};
const componentMap = {}

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

export const loadModule = (scope, module, url, preventSingleton = false) => {
    if (registeredScopes[scope] !== url || preventSingleton) {
        registerRemotes([
            {
                name: scope,
                entry: url,
                alias: scope,
            }
        ], { force: scope in registeredScopes });

        registeredScopes[scope] = url;
        moduleMap[scope] = {};
        componentMap[scope] = {};
    }

    if (!(module in moduleMap[scope])) {
        const path = `${scope}/${module.replace(/^\.\//, '')}`;

        const promise =  loadRemote(path);

        promise.catch(() => {
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

    if (!componentMap[scope] || !(module in componentMap[scope])) {
        componentMap[scope][module] = React.lazy(() => {
            return loadModule(scope, module, url, preventSingleton).then(async (Module: any) => {
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
                const matchReactVersion = requiredVersion && semver.satisfies(hostVersion, requiredVersion) && !shareScopes.some((t) => {
                    const {version, from } = t;
                    return (semver.gt(version, hostVersion) && semver.satisfies(version, requiredVersion)) || scope === from.split('-').join('_');
                })

                if (!matchReactVersion || environment !== 'production' || process.env.NODE_ENV === 'development') {
                    return { default: Module.default.CompatComponent };
                }
                return { default: Module.default.Component };
            });
        })
    }
    return componentMap[scope][module];
}

export default loadComponent;
