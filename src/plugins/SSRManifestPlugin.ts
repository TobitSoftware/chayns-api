import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

/**
 * Adds SSR metadata and resolves public path when using manifest
 */
export const SSRManifestPlugin: () => ModuleFederationRuntimePlugin = () => {
    return {
        name: 'ssr-manifest',
        loadRemoteSnapshot(args) {
            if (args.from !== 'manifest') {
                return args;
            }

            (args.remoteSnapshot as any).ssrPublicPath ??= new URL('.', args.manifestUrl).href;
            if ('remoteEntry' in args.remoteSnapshot) {
                args.remoteSnapshot.ssrRemoteEntry ??= args.remoteSnapshot.remoteEntry;
            }
            if ('remoteEntryType' in args.remoteSnapshot) {
                args.remoteSnapshot.ssrRemoteEntryType ??= args.remoteSnapshot.remoteEntryType;
            }
            return args;
        },
    }
}
