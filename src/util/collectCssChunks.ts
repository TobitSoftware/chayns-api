import { ModuleContextValueType } from '../constants';

type RemoteInfo = {
    exposes: {
        path: string,
        assets?: {
            css?: {
                sync?: string[],
                async?: string[]
            }
        }
    }[]
}

const remoteInfoCache: Record<string, RemoteInfo | null> = {};

const loadRemoteInfo = async (url: string) => {
    if (!url.endsWith('/mf-manifest.json')) {
        return null;
    }

    if (remoteInfoCache[url]) {
        return remoteInfoCache[url];
    }
    const res = await fetch(url);
    if (res.status === 200) {
        const info: RemoteInfo = await res.json();
        remoteInfoCache[url] = info;
        return info;
    }
    if (res.status === 404) {
        remoteInfoCache[url] = null;
        return null;
    }
    throw new Error(`Could not load remote info from ${url}`);
}

/**
 * Collects the css chunks from all modules rendered during SSR
 * @experimental Handling for async chunks is not final and subject to change.
 * Eventually a parameter for the rendered html might be added to analyze the async chunks
 * @param modules
 */
export const collectCssChunks = async (modules: ModuleContextValueType) => {
    const p = Object.values(modules).map(async (module) => {
        const info = await loadRemoteInfo(module.url);

        const chunks: string[] = [];
        info?.exposes.forEach((exposes) => {
            if (module.modules.has(exposes.path)) {
                const { sync = [], async = [] } = exposes.assets?.css ?? {};
                sync.forEach((chunk) => {
                    const url = new URL(chunk, module.url);
                    chunks.push(`<link rel="stylesheet" href="${url}">`)
                });
                async.forEach((chunk) => {
                    const url = new URL(chunk, module.url);
                    chunks.push(`<link rel="preload" href="${url}" as="style" onload="this.rel='stylesheet'">`)
                });
            }
        })
        return chunks;
    })
    const r = await Promise.allSettled(p);
    return r.flatMap((v) => v.status === 'fulfilled' ? v.value : []).join('')
};
