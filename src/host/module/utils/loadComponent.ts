import React from 'react';

type LoadModule = (scope: string, module: string, url: string, preventSingleton?: boolean) => Promise<unknown>;

export const loadModule: LoadModule = (...args) => {
    if (!globalThis.moduleFederationRuntime) {
        throw new Error('[chayns-api] moduleFederationSharing has not been initialized. Make sure to call initModuleFederationSharing.');
    }

    return globalThis.moduleFederationRuntime.loadModule(...args);
};

const loadComponent = (scope: string, module: string, url: string, skipCompatMode = false, preventSingleton = false) => {
    if (skipCompatMode) {
        console.warn('[chayns-api] skipCompatMode-option is deprecated and is set automatically now');
    }

    if (!globalThis.moduleFederationRuntime || !globalThis.moduleFederationScopes) {
        throw new Error('[chayns-api] moduleFederationSharing has not been initialized. Make sure to call initModuleFederationSharing.');
    }

    const { getInstance, loadModule } = globalThis.moduleFederationRuntime;
    const { componentMap, componentRegistrationKeys } = globalThis.moduleFederationScopes;

    if (!componentMap[scope]) {
        componentMap[scope] = {};
    }
    if (!componentRegistrationKeys[scope]) {
        componentRegistrationKeys[scope] = {};
    }

    if (!(module in componentMap[scope]) || componentRegistrationKeys[scope][module] !== url) {
        const promise = loadModule(scope, module, url, preventSingleton).then((Module: any) => {
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
