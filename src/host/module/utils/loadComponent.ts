import { Shared } from '@module-federation/runtime/dist/src/type';
import semver from 'semver';
import React from 'react';
import { loadRemote, registerRemotes, loadShareSync } from '@module-federation/runtime';

const registeredScopes = {};
const dynamicMap = {}

export default function loadComponent(scope, module, url, skipCompatMode = false, preventSingleton = false) {
    if (skipCompatMode) {
        console.warn('[chayns-api] skipCompatMode-option is deprecated and is set automatically now');
    }

    if (registeredScopes[scope] !== url || preventSingleton) {
        registerRemotes([
            {
                name: scope,
                entry: url,
                alias: scope,
            }
        ], { force: scope in registeredScopes });

        registeredScopes[scope] = url;
        dynamicMap[scope] = {};
    }

    if (!(module in dynamicMap[scope])) {
        const path = `${scope}/${module.replace(/^\.\//, '')}`;

        dynamicMap[scope][module] = React.lazy(() => {
            const promise =  loadRemote(path).then(async (Module: any) => {
                // semantically equals skipCompatMode
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

            promise.catch(() => {
                // causes registerRemote with force = true on next attempt to load the component which tries to load the component again
                registeredScopes[scope] = '';
            });

            return promise;
        });
    }
    return dynamicMap[scope][module];
}
