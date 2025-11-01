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

const remoteInfoCache: Record<string, RemoteInfo> = {};

const loadRemoteInfo = async (url: string) => {
    if (remoteInfoCache[url]) {
        return remoteInfoCache[url];
    }
    const res = await fetch(url);
    if (res.ok) {
        const info: RemoteInfo = await res.json();
        remoteInfoCache[url] = info;
        return info;
    }
    throw new Error(`Could not load remote info from ${url}`);
}

export const collectCssChunks = async (modules: ModuleContextValueType) => {
    const p = Object.values(modules).map(async (module) => {
        const info = await loadRemoteInfo(module.url);

        const chunks: string[] = [];
        info.exposes.forEach((exposes) => {
            if (module.modules.has(exposes.path)) {
                const { sync = [], async = [] } = exposes.assets?.css ?? {};
                [...sync, ...async].forEach((chunk) => {
                    const url = new URL(chunk, module.url);
                    chunks.push(`<link rel="stylesheet" href="${url}">`)
                });
            }
        })
        return chunks;
    })
    const r = await Promise.allSettled(p);
    return r.flatMap((v) => v.status === 'fulfilled' ? v.value : []).join('')
};
