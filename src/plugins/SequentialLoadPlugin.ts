import type { FederationRuntimePlugin } from '@module-federation/enhanced/runtime';

/**
 * Plugin to prevent parallel loading of shared dependencies
 */
export const SequentialLoadPlugin: () => FederationRuntimePlugin = () => {
    return {
        name: 'sequential-load',
        async beforeInitContainer(args) {
            const manifest = args.origin.snapshotHandler.manifestCache.get(args.remoteEntryInitOptions.version);
            const requiredShares = new Set(manifest?.shared.map(share => share.name));

            for (const [key, pkg] of Object.entries(args.shareScope)) {
                if (manifest && !requiredShares.has(key)) {
                    continue;
                }
                for (const version of Object.values(pkg)) {
                    if (!version.loaded && version.loading) {
                        await version.loading;
                    }
                }
            }

            return args;
        },
    };
};
