declare var moduleFederationScopes: {
    registeredScopes: Record<string, string>;
    componentMap: Record<string, Record<string,  React.LazyExoticComponent<React.ComponentType<any>>>>
    moduleMap: Record<string, any>;
    getInstance: () => import('@module-federation/enhanced/runtime').ModuleFederation;
};
