import React, { createContext } from 'react';

export type HydrationContextValueType = { [key: string]: { getState: () => object, abort?: () => Promise<void> } };

export let HydrationContext: React.Context<HydrationContextValueType>;

// force single context on server-side (fake sharing)
if (!globalThis.window && globalThis._hydrationContext) {
    HydrationContext = globalThis._hydrationContext;
} else {
    HydrationContext = createContext({});
    globalThis._hydrationContext = HydrationContext;
}
