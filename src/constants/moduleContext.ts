import React, { createContext } from 'react';

export type ModuleContextValueType = Record<string, { url: string, modules: Set<string> }>;

export let ModuleContext: React.Context<ModuleContextValueType>;

// force single context on server-side (fake sharing)
if (!globalThis.window && globalThis._moduleContext) {
    ModuleContext = globalThis._moduleContext;
} else {
    const emptyReadonly = new Proxy({}, {
        set() {
            return true;
        },
        defineProperty() {
            return true;
        },
        deleteProperty() {
            return true;
        }
    });
    ModuleContext = createContext(emptyReadonly);
    globalThis._moduleContext = ModuleContext;
}
