import React, { createContext } from 'react';
import type { StoreLikeValue } from '../components/withHydrationBoundary';

export type HydrationContextValueType = {
    [key: string]: StoreLikeValue
};

export let HydrationContext: React.Context<HydrationContextValueType>;

// force single context on server-side (fake sharing)
if (!globalThis.window && globalThis._hydrationContext) {
    HydrationContext = globalThis._hydrationContext;
} else {
    HydrationContext = createContext({});
    globalThis._hydrationContext = HydrationContext;
}
