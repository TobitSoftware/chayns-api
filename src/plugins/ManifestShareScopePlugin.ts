import React from 'react';
import { satisfy } from '@module-federation/runtime-core';
import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

const LEGACY_SHARE_SCOPE = 'chayns-api';
const HOST_REACT_SHARE_SCOPE = 'chayns-react';
const MANIFEST_SUFFIX = 'mf-manifest.json';

const isManifestUrl = (url: string) => {
    try {
        return new URL(url).pathname.endsWith(`/${MANIFEST_SUFFIX}`);
    } catch {
        return url.endsWith(MANIFEST_SUFFIX);
    }
};

export const ManifestShareScopePlugin = (): ModuleFederationRuntimePlugin => {
    const legacyRemotes = new WeakSet<object>();

    return {
        name: 'manifest-share-scope',
        beforeRegisterRemote(args) {
            if (args.remote.shareScope) {
                legacyRemotes.add(args.remote);
            } else if ('entry' in args.remote && args.remote.entry.endsWith('v2.remoteEntry.js')) {
                Object.assign(args.remote, { shareScope: LEGACY_SHARE_SCOPE });
            }
            return args;
        },
        async beforeRequest(args) {
            const remote = args.options.remotes.find((candidate) => {
                const name = candidate.name;
                const alias = candidate.alias;
                return args.id === name || args.id.startsWith(`${name}/`) || (alias && (args.id === alias || args.id.startsWith(`${alias}/`)));
            });

            if (!remote || legacyRemotes.has(remote) || !('entry' in remote) || !isManifestUrl(remote.entry)) {
                return args;
            }

            await args.origin.snapshotHandler.loadRemoteSnapshotInfo({
                moduleInfo: remote,
                id: args.id,
            });

            const manifest = args.origin.snapshotHandler.manifestCache.get(remote.entry);
            const remoteShareScope = (manifest?.metaData as { reactShareScope?: string } | undefined)?.reactShareScope;
            const reactRequiredVersion = manifest?.shared.find((shared) => shared.name === 'react')?.requiredVersion;

            remote.shareScope = !remoteShareScope
                ? LEGACY_SHARE_SCOPE
                : reactRequiredVersion && satisfy(React.version, reactRequiredVersion)
                    ? `${HOST_REACT_SHARE_SCOPE}-${React.version}`
                    : remoteShareScope;

            return args;
        },
    };
};
