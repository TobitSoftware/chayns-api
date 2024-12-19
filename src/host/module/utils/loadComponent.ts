import { Shared } from '@module-federation/runtime/dist/src/type';
import type { Root } from 'react-dom/client';
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

            const shareScopes = typeof getInstance === 'function' ? getInstance().shareScopeMap : await new Promise<Shared[]>(resolve => {
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

            if (!matchReactVersion || environment !== 'production' || process.env.NODE_ENV === 'development' || Module.default.version !== 2) {
                if (semver.lt(React.version, '19.0.0')) {
                    return {
                        default: Module.default.CompatComponent,
                    };
                }

                const scopes = shareScopes[Module.default.version === 2 ? 'chayns-api' : 'default'];
                const reactVersion = Object.keys(scopes.react).reduce((p: null | string, e) => {
                    if (!semver.satisfies(e, requiredVersion)) {
                        return p;
                    }
                    return !p || semver.gt(e, p) ? e : p;
                }, null)!;
                const CompatReact = (await scopes.react[reactVersion].get())();
                const CompatReactDOM = (await scopes['react-dom'][reactVersion].get())();

                class CompatComponent extends React.Component {
                    root: Root = undefined!;
                    ref: React.RefObject<HTMLDivElement>;

                    constructor(props) {
                        super(props);
                        this.ref = React.createRef();
                    }

                    componentDidMount() {
                        this.root = CompatReactDOM.createRoot(this.ref.current);
                        this.root.render(CompatReact.createElement(Module.default.Component, this.props));
                    }

                    componentDidUpdate(prevProps, prevState, snapshot) {
                        setTimeout(() => {
                            this.root.render(CompatReact.createElement(Module.default.Component, this.props));
                        }, 0);
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
