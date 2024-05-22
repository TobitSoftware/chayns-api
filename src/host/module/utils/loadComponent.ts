import ReactDOM from 'react-dom';
import semver from 'semver';
import React from 'react';
import { loadRemote, registerRemotes, loadShareSync, init } from '@module-federation/runtime';

const registeredScopes = {};
const moduleMap = {};
const componentMap = {}

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

export const loadModule = async (scope, module, url, preventSingleton = false) => {
    // @ts-expect-error
    if (typeof __webpack_init_sharing__ === 'function') {
        // @ts-expect-error
        await __webpack_init_sharing__('default');
    }
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
        ], { force: scope in registeredScopes });

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

            const shareScopes = await new Promise<{ version: string, from: string }[]>(resolve => {
                // @ts-expect-error
                if (typeof __webpack_share_scopes__ !== 'undefined') {
                    // @ts-expect-error
                    const shareScopes = __webpack_share_scopes__.default;
                    console.log('__webpack_share_scopes__', shareScopes);
                    const shareList = Object.entries<object & { from: string }>(shareScopes.react).map(([k, v]) => ({
                        version: k,
                        from: v.from,
                    }));
                    resolve(shareList);
                }

                loadShareSync('react', {
                    resolver: (shareOptions) => {
                        resolve(shareOptions);
                        console.log('mf runtime share scopes', shareOptions);
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
