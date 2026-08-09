import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

const REACT_FAMILY_SHARES = new Set([
    'react',
    'react-dom',
    'react-dom/client',
    'react-dom/server',
    'react/jsx-runtime',
]);

type ShareLock = {
    from: string;
    version: string;
};

const getReactFamilyShares = (args: any): Set<string> => {
    const manifest = args.origin.snapshotHandler.manifestCache.get(args.remoteEntryInitOptions.version);
    const sharedNames = manifest?.shared?.map((share: any) => share.name).filter((name: string) => REACT_FAMILY_SHARES.has(name));

    if (sharedNames?.length) {
        return new Set<string>(sharedNames);
    }

    return new Set<string>(REACT_FAMILY_SHARES);
};

const getShareKey = (shared: any) => shared?.from && shared?.version ? `${shared.from}\n${shared.version}` : undefined;

const getCompleteFamilyShareKeys = (shareScope: any, requiredShares: Set<string>) => {
    let completeKeys: Set<string> | undefined;

    for (const pkgName of requiredShares) {
        const versions = shareScope[pkgName];
        const keys = new Set<string>();

        if (!versions) {
            return new Set<string>();
        }

        for (const shared of Object.values(versions)) {
            const key = getShareKey(shared);

            if (key) {
                keys.add(key);
            }
        }

        if (!completeKeys) {
            completeKeys = keys;
            continue;
        }

        completeKeys = new Set([...completeKeys].filter(key => keys.has(key)));

        if (!completeKeys.size) {
            return completeKeys;
        }
    }

    return completeKeys ?? new Set<string>();
};

const getPreferredShareKey = (shareScope: any, requiredShares: Set<string>, lock?: ShareLock) => {
    const completeKeys = getCompleteFamilyShareKeys(shareScope, requiredShares);

    if (!completeKeys.size) {
        return undefined;
    }

    if (lock) {
        const lockKey = `${lock.from}\n${lock.version}`;

        return completeKeys.has(lockKey) ? lockKey : undefined;
    }

    for (const pkgName of requiredShares) {
        const versions = shareScope[pkgName];

        for (const shared of Object.values(versions) as any[]) {
            const key = getShareKey(shared);

            if (key && completeKeys.has(key) && shared.loaded) {
                return key;
            }
        }
    }

    const sortedKeys = [...completeKeys].sort();

    return sortedKeys[sortedKeys.length - 1];
};

const createFilteredShareScope = (shareScope: any, requiredShares: Set<string>, shareKey?: string) => {
    const filteredShareScope = {
        ...shareScope,
    };

    for (const pkgName of REACT_FAMILY_SHARES) {
        const versions = shareScope[pkgName];

        if (!versions) {
            continue;
        }

        if (!requiredShares.has(pkgName)) {
            filteredShareScope[pkgName] = versions;
            continue;
        }

        filteredShareScope[pkgName] = shareKey ? Object.fromEntries(Object.entries(versions).filter(([, shared]) => getShareKey(shared) === shareKey)) : {};
    }

    return filteredShareScope;
};

const withFilteredVersions = <T>(versions: Record<string, unknown>, filter: (shared: any) => boolean, resolve: () => T) => {
    const originalEntries = Object.entries(versions);
    const filteredEntries = originalEntries.filter(([, shared]) => filter(shared));

    for (const version of Object.keys(versions)) {
        delete versions[version];
    }

    for (const [version, shared] of filteredEntries) {
        versions[version] = shared;
    }

    try {
        return resolve();
    } finally {
        for (const version of Object.keys(versions)) {
            delete versions[version];
        }

        for (const [version, shared] of originalEntries) {
            versions[version] = shared;
        }
    }
};

/**
 * Keeps all React-related shared imports of a remote on the same provider/version pair.
 */
export const ReactFamilyShareLockPlugin: () => ModuleFederationRuntimePlugin = () => {
    const locks = new Map<string, ShareLock>();

    return {
        name: 'react-family-share-lock',
        async beforeInitContainer(args: any) {
            const shareScopeKeys = args.remoteEntryInitOptions.shareScopeKeys;
            const shareScopes = Array.isArray(shareScopeKeys) ? shareScopeKeys : [shareScopeKeys];

            if (!shareScopes.includes('chayns-api')) {
                return args;
            }

            const consumer = args.remoteInfo.name;
            const lockKey = `chayns-api:${consumer}`;
            const requiredShares = getReactFamilyShares(args);
            const preferredShareKey = getPreferredShareKey(args.shareScope, requiredShares, locks.get(lockKey));
            const shareScope = requiredShares.size ? createFilteredShareScope(args.shareScope, requiredShares, preferredShareKey) : args.shareScope;
            const shareScopeMap = {
                ...args.origin.shareScopeMap,
                'chayns-api': shareScope,
            };
            const remoteEntryInitOptions = {
                version: args.remoteEntryInitOptions.version,
                shareScopeKeys: args.remoteEntryInitOptions.shareScopeKeys,
            };

            if (preferredShareKey) {
                const [from, version] = preferredShareKey.split('\n');

                locks.set(lockKey, { from, version });
            }

            Object.defineProperty(remoteEntryInitOptions, 'shareScopeMap', {
                value: shareScopeMap,
                enumerable: false,
            });

            return {
                ...args,
                shareScope,
                remoteEntryInitOptions,
            };
        },
        resolveShare(args: any) {
            if (args.scope !== 'chayns-api' || !REACT_FAMILY_SHARES.has(args.pkgName)) {
                return args;
            }

            const consumer = args.shareInfo?.from;

            if (!consumer) {
                return args;
            }

            const lockKey = `${args.scope}:${consumer}`;

            return {
                ...args,
                resolver: () => {
                    const versions = args.shareScopeMap?.[args.scope]?.[args.pkgName];

                    if (!versions) {
                        return undefined;
                    }

                    const lock = locks.get(lockKey);

                    if (lock) {
                        return withFilteredVersions(versions, (shared) => shared.from === lock.from && shared.version === lock.version, args.resolver);
                    }

                    const resolved = args.resolver();
                    const shared = resolved?.shared;

                    if (shared?.from && shared?.version) {
                        locks.set(lockKey, {
                            from: shared.from,
                            version: shared.version,
                        });
                    }

                    return resolved;
                },
            };
        },
    };
};
