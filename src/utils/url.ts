import { Environment } from '../types/IChaynsReact';

export const replaceStagingUrl = (prevent, url, environment) => {
    if (prevent || !url) return url;
    let replacedUrl = url;
    if (environment === Environment.Qa || environment === Environment.Development) {
        replacedUrl = replacedUrl.replace('tapp.chayns-static.space', 'tapp-dev.chayns-static.space');
    }
    if (environment === Environment.Staging) {
        replacedUrl = replacedUrl.replace('tapp.chayns-static.space', 'tapp-staging.chayns-static.space');
    }
    return replacedUrl;
};
