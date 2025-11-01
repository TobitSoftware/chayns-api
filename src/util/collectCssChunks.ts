import { ModuleContextValueType } from '../constants/moduleContext';

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

export const collectCssChunks = async (modules: ModuleContextValueType) => {
    const p = Object.values(modules).map(async (module) => {
        const res = await fetch(module.url);
        if (!res.ok) {
            return [];
        }
        const info: RemoteInfo = await res.json();

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
    return r.flatMap((v) => v.status === 'fulfilled' ? v.value : [])
};
