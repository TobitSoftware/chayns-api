import { ModuleContextValueType } from '../constants';

export const collectCssChunks = (modules: ModuleContextValueType) => {
    const instance = globalThis.moduleFederationRuntime.getInstance();
    const p = Object.values(modules).map((module) => {
        const info = instance.snapshotHandler.manifestCache.get(module.url);

        const chunks: string[] = [];
        info?.exposes.forEach((exposes) => {
            if (exposes.path && module.modules.has(exposes.path)) {
                const { sync = [], async = [] } = exposes.assets?.css ?? {};
                [...sync, ...async].forEach((chunk) => {
                    const url = new URL(chunk, module.url);
                    chunks.push(`<link rel="stylesheet" href="${url}">`);
                });
            }
        });
        return chunks;
    });
    return p.flat().join('');
};
