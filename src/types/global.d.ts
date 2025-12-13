declare var moduleFederationScopes: {
    registeredScopes: Record<string, string>;
    componentMap: Record<string, Record<string,  React.LazyExoticComponent<React.ComponentType<any>>>>
    moduleMap: Record<string, any>;
};

declare var moduleFederationRuntime: typeof import('@module-federation/enhanced/runtime');
