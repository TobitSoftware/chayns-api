import React from 'react';

type LoadModule = (scope: string, module: string, url: string, preventSingleton?: boolean) => Promise<unknown>;

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

    if (!globalThis.moduleFederationScopes.errorResetTimeouts) {
        globalThis.moduleFederationScopes.errorResetTimeouts = new Set();
    }

    const errorResetTimeouts = globalThis.moduleFederationScopes.errorResetTimeouts;

    if (errorResetTimeouts.has(key)) {
        return;
    }

    errorResetTimeouts.add(key);
    setTimeout(() => {
        const { registeredScopes } = globalThis.moduleFederationScopes;

        if (registeredScopes[scope] === url) {
            registeredScopes[scope] = '';
        }

        errorResetTimeouts.delete(key);
    }, 60000);
};

const legacyLoadModule: LoadModule = (scope, module, url, preventSingleton = false) => {
    if (!globalThis.moduleFederationRuntime || !globalThis.moduleFederationScopes) {
        throw new Error('[chayns-api] moduleFederationSharing has not been initialized. Make sure to call initModuleFederationSharing.');
    }
    console.warn('[chayns-api] Using legacy loadModule implementation. Please update the host to 3.7.0 or higher to use the new loadModule implementation.');

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
};

export const loadModule: LoadModule = (...args) => {
    if (!globalThis.moduleFederationRuntime) {
        throw new Error('[chayns-api] moduleFederationSharing has not been initialized. Make sure to call initModuleFederationSharing.');
    }

    return globalThis.moduleFederationRuntime.loadModule?.(...args) ?? legacyLoadModule(...args);
};

const loadComponent = (scope: string, module: string, url: string, skipCompatMode = false, preventSingleton = false) => {
    if (skipCompatMode) {
        console.warn('[chayns-api] skipCompatMode-option is deprecated and is set automatically now');
    }

    if (!globalThis.moduleFederationRuntime || !globalThis.moduleFederationScopes) {
        throw new Error('[chayns-api] moduleFederationSharing has not been initialized. Make sure to call initModuleFederationSharing.');
    }

    const { getInstance, loadModule: hostLoadModule } = globalThis.moduleFederationRuntime;
    const { componentMap } = globalThis.moduleFederationScopes;
    const componentRegistrationKeys = globalThis.moduleFederationScopes.componentRegistrationKeys ??= {};

    if (!componentMap[scope]) {
        componentMap[scope] = {};
    }
    if (!componentRegistrationKeys[scope]) {
        componentRegistrationKeys[scope] = {};
    }

    if (!(module in componentMap[scope]) || componentRegistrationKeys[scope][module] !== url) {
        const promise = (hostLoadModule ?? legacyLoadModule)(scope, module, url, preventSingleton).then((Module: any) => {
            if (typeof Module.default === 'function') {
                return Module;
            }

            const shareScopes = getInstance().shareScopeMap;
            const matchReactVersion = Object.values(shareScopes)
                .map((shareScope) => shareScope.react?.[React.version])
                .some((reactShare) => reactShare?.useIn.includes(scope) && reactShare.lib?.() === React);

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

        promise.catch((error) => {
            console.error('[chayns-api] Failed to load component', scope, url, error);
        });

        componentMap[scope][module] = React.lazy(() => promise);
        componentRegistrationKeys[scope][module] = url;
    }
    return componentMap[scope][module];
};

export default loadComponent;
