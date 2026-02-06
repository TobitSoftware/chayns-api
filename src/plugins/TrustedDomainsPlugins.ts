import { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

class TrustedDomainsError extends Error {
    public readonly name = 'TrustedDomainsError' as const;
    public readonly isTrustedDomainsError = true as const;

    constructor(entry: string) {
        super('Remote entry ' + entry + ' is not in trusted domains');
    }
}

export const TrustedDomainsPlugin = (trustedDomains: string[] = []): ModuleFederationRuntimePlugin => {
    return {
        name: 'trusted-domains',
        beforeRequest(args) {
            args.options.remotes.forEach((remote) => {
                if ('entry' in remote) {
                    const parsed = new URL(remote.entry);
                    if (!trustedDomains.some(domain => parsed.hostname.endsWith(domain))) {
                        throw new TrustedDomainsError(remote.entry);
                    }
                }
            });
            return args;
        },
    };
};

export function isTrustedDomainsError(error: unknown): error is TrustedDomainsError {
    return error instanceof Error && error.name === 'TrustedDomainsError' && 'isTrustedDomainsError' in error && error.isTrustedDomainsError === true;
}
