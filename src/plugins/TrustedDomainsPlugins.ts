import { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import { loadTrustedDomains } from '../utils/loadTrustedDomains';

class TrustedDomainsError extends Error {
    public readonly name = 'TrustedDomainsError' as const;

    constructor(entry: string) {
        super('Remote entry ' + entry + ' is not in trusted domains');
    }
}

export const TrustedDomainsPlugin = (trustedDomains?: string[]): ModuleFederationRuntimePlugin => {
    let trustedDomainsPromise: Promise<string[]> | undefined;

    const getTrustedDomains = () => {
        if (trustedDomains) {
            return trustedDomains;
        }
        trustedDomainsPromise ??= loadTrustedDomains();
        return trustedDomainsPromise;
    };

    return {
        name: 'trusted-domains',
        async beforeRequest(args) {
            const domains = await getTrustedDomains();

            args.options.remotes.forEach((remote) => {
                if ('entry' in remote) {
                    const parsed = new URL(remote.entry);
                    if (!domains.some(domain => parsed.hostname.endsWith(domain))) {
                        throw new TrustedDomainsError(remote.entry);
                    }
                }
            });
            return args;
        },
    };
};

export function isTrustedDomainsError(error: unknown): error is TrustedDomainsError {
    return error instanceof Error && error.name === 'TrustedDomainsError';
}
