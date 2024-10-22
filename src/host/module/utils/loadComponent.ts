import { Shared } from '@module-federation/runtime/dist/src/type';
import semver from 'semver';
import React from "react";

export const loadModule = (scope, module, url, preventSingleton = false, shareScope = 'chayns-api2') => {
    console.log("share2", shareScope);
    const { loadRemote, registerRemotes } = globalThis.moduleFederationRuntime;
    const { registeredScopes, moduleMap, componentMap } = globalThis.moduleFederationScopes;
    if (registeredScopes[scope] !== url || preventSingleton) {
        if (scope in registeredScopes) {
            console.error(`[chayns-api] call registerRemote with force for scope ${scope}. url: ${url}`);
        }
        console.log("register remote ", {
            shareScope,
            name: scope,
            entry: url,
            alias: scope,
        })
        registerRemotes([
            {
                shareScope,
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

const loadComponent = (scope, module, url, skipCompatMode = false, preventSingleton = false, shareScope) => {
    console.log("share1", shareScope);
    if (skipCompatMode) {
        console.warn('[chayns-api] skipCompatMode-option is deprecated and is set automatically now');
    }

    const { loadShareSync } = globalThis.moduleFederationRuntime;
    const { componentMap } = globalThis.moduleFederationScopes;

    if (!componentMap[scope]) {
        componentMap[scope] = {};
    }

    if (!(module in componentMap[scope])) {
        const promise = loadModule(scope, module, url, preventSingleton, shareScope).then(async (Module: any) => {
            if (typeof Module.default === 'function') {
                return Module;
            }
            const hostVersion = semver.minVersion(React.version)!;
            const { requiredVersion, environment } = Module.default;

            const shareScopes = await new Promise<Shared[]>(resolve => {
                loadShareSync('react', {
                    resolver: (shareOptions) => {
                        resolve(shareOptions);
                        console.log("shareOptions", shareOptions);
                        return shareOptions[0];
                    },
                });
            });
            const matchReactVersion = requiredVersion && semver.satisfies(hostVersion, requiredVersion) && !shareScopes.some(({ version, from }) => {
                return (semver.gt(version, hostVersion) && semver.satisfies(version, requiredVersion)) || scope === from.split('-').join('_');
            })

            if (!matchReactVersion || environment !== 'production' || process.env.NODE_ENV === 'development' || Module.default.version !== 2) {
                console.log("use compat mode for", scope, module);
                return { default: Module.default.CompatComponent };
            }
            console.log("use direct component for", scope, module);
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
