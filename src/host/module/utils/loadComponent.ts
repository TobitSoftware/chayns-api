import React from "react";

const ERROR_CACHE_TIME = 60000;
const errorResetTimeouts = new Set<string>();

const normalizeUrl = (url: string) => {
    try {
        // try simplifying url to avoid force when url is semantically the same, e.g.
        // https://example.com/remoteEntry.js and https://example.com/js/../remoteEntry.js
        return new URL(url).toString();
    } catch {
        return url;
    }
};

const resetAfterCacheTime = (scope: string, module: string, url: string) => {
    const key = `${scope}\n${module}\n${url}`;

    if (errorResetTimeouts.has(key)) {
        return;
    }

    errorResetTimeouts.add(key);
    setTimeout(() => {
        const { registeredScopes, componentMap } = globalThis.moduleFederationScopes;

        if (registeredScopes[scope] === url) {
            registeredScopes[scope] = '';
        }

        delete componentMap[scope]?.[module];
        errorResetTimeouts.delete(key);
    }, ERROR_CACHE_TIME);
};

export const loadModule = (scope: string, module: string, url: string, preventSingleton = false) => {
    if (!globalThis.moduleFederationRuntime || !globalThis.moduleFederationScopes) {
        throw new Error('[chayns-api] moduleFederationSharing has not been initialized. Make sure to call initModuleFederationSharing.');
    }

    const { loadRemote, registerRemotes } = globalThis.moduleFederationRuntime;
    const { registeredScopes, moduleMap, componentMap } = globalThis.moduleFederationScopes;
    const remoteUrl = normalizeUrl(url);

    if (registeredScopes[scope] !== remoteUrl || preventSingleton) {
        if (scope in registeredScopes) {
            console.error(`[chayns-api] call registerRemote with force for scope ${scope}. url: ${remoteUrl}`);
        }
        registerRemotes([
            {
                shareScope: url.endsWith('v2.remoteEntry.js') || url.endsWith('mf-manifest.json') ? 'chayns-api' : 'default',
                name: scope,
                entry: url,
            }
        ], { force: (scope in registeredScopes) || preventSingleton });

        registeredScopes[scope] = remoteUrl;
        moduleMap[scope] = {};
        componentMap[scope] = {};
    }

    if (!(module in moduleMap[scope])) {
        const path = `${scope}/${module.replace(/^\.\//, '')}`;

        const promise = loadRemote(path);

        promise.catch((e) => {
            console.error("[chayns-api] Failed to load module", scope, remoteUrl, e);
            resetAfterCacheTime(scope, module, remoteUrl);
        });

        return promise;
    }
    return moduleMap[scope][module];
}

const loadComponent = (scope: string, module: string, url: string, skipCompatMode = false, preventSingleton = false) => {
    if (skipCompatMode) {
        console.warn('[chayns-api] skipCompatMode-option is deprecated and is set automatically now');
    }

    if (!globalThis.moduleFederationRuntime || !globalThis.moduleFederationScopes) {
        throw new Error('[chayns-api] moduleFederationSharing has not been initialized. Make sure to call initModuleFederationSharing.');
    }

    const { getInstance } = globalThis.moduleFederationRuntime;
    const { componentMap, registeredScopes } = globalThis.moduleFederationScopes;

    if (!componentMap[scope]) {
        componentMap[scope] = {};
    }

    if (!(module in componentMap[scope]) || registeredScopes[scope] !== url) {
        const promise = loadModule(scope, module, url, preventSingleton).then(async (Module: any) => {
            if (typeof Module.default === 'function') {
                return Module;
            }

            const shareScopes = getInstance().shareScopeMap;

            const sharedReact = shareScopes['chayns-api'].react?.[React.version];
            const matchReactVersion = sharedReact && sharedReact.useIn.includes(scope) && sharedReact.lib?.() === React;

            if (!matchReactVersion || Module.default.environment !== 'production' || (Module.default.version || 1) < 2) {
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
                        return React.createElement('div', { ref: this.ref, 'data-compat-mode': true });
                    }
                }

                return { default: CompatComponent };
            }
            return { default: Module.default.Component };
        });

        promise.catch((e) => {
            console.error("[chayns-api] Failed to load component", scope, url, e);
        });

        componentMap[scope][module] = React.lazy(() => promise);
    }
    return componentMap[scope][module];
}

export default loadComponent;
