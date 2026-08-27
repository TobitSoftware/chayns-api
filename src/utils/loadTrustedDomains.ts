import { DefaultTrustedDomains } from '../constants/trustedDomains';

const TRUSTED_DOMAINS_URL = 'https://service-rpc.chayns.net/ConfigurationSettings/TrustedDomains';

let trustedDomainsPromise: Promise<string[]> | undefined;

const fetchTrustedDomains = async (): Promise<string[]> => {
    try {
        const response = await fetch(TRUSTED_DOMAINS_URL, {
            signal: AbortSignal.timeout?.(5000),
        });

        if (response.status === 200) {
            const { trustedDomains } = await response.json() as { trustedDomains: string[] };
            return trustedDomains;
        }
    } catch {
        return DefaultTrustedDomains;
    }

    return DefaultTrustedDomains;
};

export const loadTrustedDomains = (): Promise<string[]> => {
    trustedDomainsPromise ??= fetchTrustedDomains();
    return trustedDomainsPromise;
};
