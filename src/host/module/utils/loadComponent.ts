import semver from 'semver';
import React from 'react';
import { loadRemote, registerRemotes } from '@module-federation/runtime';

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
            return loadRemote(path).then((Module: any) => {
                // semantically equals skipCompatMode
                if (typeof Module.default === 'function') {
                    return Module;
                }
                const hostVersion = semver.minVersion(React.version)!;
                const { requiredVersion, environment } = Module.default;
                // @ts-expect-error
                const webpackShareScopes = __webpack_share_scopes__.default;
                const matchReactVersion = requiredVersion && semver.satisfies(hostVersion, requiredVersion) && !Object.keys(webpackShareScopes.react).some((version) => {
                    return (semver.gt(version, hostVersion) && semver.satisfies(version, requiredVersion)) || scope === webpackShareScopes.react[version].from.split('-').join('_');
                });

                if (!matchReactVersion || environment !== 'production' || process.env.NODE_ENV === 'development') {
                    return { default: Module.default.CompatComponent };
                }
                return { default: Module.default.Component };
            });
        });
    }
    return dynamicMap[scope][module];
}
