import { Shared } from '@module-federation/runtime/dist/src/type';
import semver from 'semver';
import React from "react";

export const loadModule = (scope, module, url, preventSingleton = false) => {
    const { loadRemote, registerRemotes } = globalThis.moduleFederationRuntime;
    const { registeredScopes, moduleMap, componentMap } = globalThis.moduleFederationScopes;
    if (registeredScopes[scope] !== url || preventSingleton) {
        if (scope in registeredScopes) {
            console.error(`[chayns-api] call registerRemote with force for scope ${scope}. url: ${url}`);
        }
        registerRemotes([
            {
                shareScope: url.endsWith('v2.remoteEntry.js') ? 'chayns-api' : 'default',
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

    const { loadShareSync, getInstance } = globalThis.moduleFederationRuntime;
    const { componentMap } = globalThis.moduleFederationScopes;

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

            const shareScopes: { [scope: string]: { [pkg: string]: { [version: string]: Shared } } } = typeof getInstance === 'function' ? getInstance().shareScopeMap : await new Promise(resolve => {
                loadShareSync('react', {
                    resolver: (shareOptions) => {
                        const optionsMap = shareOptions.reduce((p, e) => {
                            p[e.version] = e;
                            e.version;
                            return p;
                        }, {});
                        resolve({ 'chayns-api': optionsMap });
                        return shareOptions[0];
                    },
                });
            });

            const matchReactVersion = requiredVersion && semver.satisfies(hostVersion, requiredVersion) && !Object.values(shareScopes['chayns-api'].react).some(({ version, from }) => {
                return (semver.gt(version, hostVersion) && semver.satisfies(version, requiredVersion)) || scope === from.split('-').join('_');
            })

            if (!matchReactVersion || environment !== 'production' || process.env.NODE_ENV === 'development' || (Module.default.version || 1) < 2) {
                const OriginalCompatComponent = (Module.default.version || 1) < 2.1 ? Module.default.CompatComponent.render({}).type.prototype : Module.default.CompatComponent.prototype;

                class CompatComponent extends React.Component {
                    ref: React.RefObject<HTMLDivElement>;

                    constructor(props) {
                        super(props);
                        this.ref = React.createRef();
                    }

                    componentDidMount() {
                        OriginalCompatComponent.componentDidMount.apply(this);
                    }

                    componentDidUpdate(prevProps, prevState, snapshot) {
                        OriginalCompatComponent.componentDidUpdate.apply(this, prevProps, prevState, snapshot);
                    }

                    componentWillUnmount() {
                        OriginalCompatComponent.componentWillUnmount.apply(this);
                    }

                    render() {
                        return React.createElement('div', { ref: this.ref });
                    }
                }

                return { default: CompatComponent };
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
