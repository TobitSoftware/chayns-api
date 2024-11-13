import React, { createContext } from 'react';
import { type StoreLikeValue } from '../components/withHydrationBoundary';

export type HydrationContextValueType<T> = {
    [key: string]: StoreLikeValue<T>
};

export let HydrationContext: React.Context<HydrationContextValueType<object>>;

// force single context on server-side (fake sharing)
if (!globalThis.window && globalThis._hydrationContext) {
    HydrationContext = globalThis._hydrationContext;
} else {
    HydrationContext = createContext({});
    globalThis._hydrationContext = HydrationContext;
}
