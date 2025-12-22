declare var moduleFederationScopes: {
    registeredScopes: Record<string, string>;
    componentMap: Record<string, Record<string, React.LazyExoticComponent<React.ComponentType<any>>>>
    moduleMap: Record<string, any>;
};

declare var moduleFederationRuntime: {
    loadRemote: import('@module-federation/enhanced/runtime').ModuleFederation['loadRemote'];
    registerRemotes: import('@module-federation/enhanced/runtime').ModuleFederation['registerRemotes'];
    getInstance: () => import('@module-federation/enhanced/runtime').ModuleFederation;
}
