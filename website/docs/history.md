---
title: History
slug: history
---

The history API in `chayns-api` gives you a structured navigation model on top of the browser history. Instead of treating the URL as one flat string, it splits navigation into **layers**. Each layer can own:

- route segments
- state
- query params
- a hash
- an optional active child layer

This makes it possible to model nested navigation cleanly, including hosted modules and iframes.

## What problem this solves

Many chayns pages are not just a single screen. They often contain:

- multiple internal views
- overlays and state that should participate in back/forward navigation
- embedded modules
- embedded iframes

The history API lets each of these parts work with its **own navigation scope** while still projecting everything into the single browser history of the page.

## Core concepts

### Root layer

The root layer represents the main history scope of the current window.

You usually get it in one of two ways:

1. Automatically through `ChaynsProvider`
2. Manually through `initRootChaynsHistoryLayer()` or `getOrInitRootChaynsHistoryLayer()`

### Child layers

A layer can have child layers. Only one child can be active at a time.

The active chain looks like this:

```text
root -> shop -> product
```

Only the layers in that active chain contribute to the final URL and active state.

### Segment ownership

Each layer owns a configurable number of path segments via `segmentCount`.

Example:

```text
/shop/products/details
```

If:

- `root` owns `1` segment
- child `catalog` owns `1` segment
- child `details` owns `1` segment

then the effective routes are:

- `root`: `['shop']`
- `catalog`: `['products']`
- `details`: `['details']`

### State, params, and hash

Each layer also owns its own:

- `state`
- `params`
- `hash`

When the URL is projected:

- route segments are concatenated along the active chain
- params are merged along the active chain
- the deepest explicitly set hash wins

## Quick start

### Use history in a normal page

Wrap your app with `ChaynsProvider` and enable history:

```tsx
import { ChaynsProvider } from 'chayns-api';

export default function AppRoot() {
    return (
        <ChaynsProvider
            isHistoryEnabled
            history={{ segmentCount: 1 }}
        >
            <App />
        </ChaynsProvider>
    );
}
```

`segmentCount` defines how many path segments this layer claims initially.

For `/shop/products`, the example above would give the root layer:

```ts
['shop']
```

The remaining segments can later be claimed by child layers.

### Read and write the current route

```tsx
import { useChaynsHistoryRoute } from 'chayns-api';

export function ProductList() {
    const { segments, setRoute } = useChaynsHistoryRoute();

    return (
        <>
            <div>Current route: {segments.join('/')}</div>
            <button onClick={() => void setRoute(['products'])}>
                Open products
            </button>
        </>
    );
}
```

### Navigate route and state together

```tsx
import { useChaynsHistoryNavigate } from 'chayns-api';

export function OpenProductButton() {
    const navigate = useChaynsHistoryNavigate();

    return (
        <button
            onClick={() =>
                void navigate({
                    route: ['products', '42'],
                    state: { productId: 42 },
                })
            }
        >
            Open product
        </button>
    );
}
```

## Available hooks

### `useChaynsHistoryLayer()`

Returns the current layer instance.

Use this when you need the full imperative API.

```tsx
import { useChaynsHistoryLayer } from 'chayns-api';

const layer = useChaynsHistoryLayer();
```

### `useChaynsHistoryRoute()`

Returns:

- `segments`
- `setRoute(route, opts?)`

Example:

```tsx
const { segments, setRoute } = useChaynsHistoryRoute();
await setRoute(['settings']);
```

### `useChaynsHistoryState<T>()`

Returns:

- `state`
- `setState(state, opts?)`

Example:

```tsx
const [state, setState] = useChaynsHistoryState<{ tab?: string }>();
await setState({ tab: 'profile' });
```

### `useChaynsHistoryParams()`

Returns:

- `params`
- `setParams(params, opts?)`

Important: `setParams()` replaces the params of the current layer. Merge manually if needed.

```tsx
const [params, setParams] = useChaynsHistoryParams();
await setParams({ ...params, filter: 'open' });
```

### `useChaynsHistoryHash()`

Returns:

- `hash`
- `setHash(hash, opts?)`

```tsx
const [hash, setHash] = useChaynsHistoryHash();
await setHash('details');
```

Use an empty string to clear the hash explicitly.

### `useChaynsHistoryNavigate()`

Returns a single `navigate()` function that can update several parts atomically:

- `route`
- `state`
- `params`
- `hash`
- `activeChild`
- `activeChildInit`
- `isReplace`

```tsx
const navigate = useChaynsHistoryNavigate();

await navigate({
    route: ['orders'],
    params: { page: '2' },
    hash: 'top',
    state: { selectedId: 15 },
});
```

### `useChaynsHistoryActiveChild()`

Returns:

- `activeChildId`
- `setActiveChild(id, init?)`

```tsx
const { activeChildId, setActiveChild } = useChaynsHistoryActiveChild();
await setActiveChild('details', { route: ['42'] });
```

### `useChaynsHistoryChildLayer(id)`

Returns the child layer with the given id and creates it if necessary.

```tsx
const detailsLayer = useChaynsHistoryChildLayer('details');
```

This is useful when you want to explicitly scope part of the UI to a dedicated child layer.

### `useChaynsHistoryBlock()`

Registers a navigation blocker.

The callback must return:

- `true` to allow navigation
- `false` to block navigation

```tsx
import { useCallback } from 'react';
import { useChaynsHistoryBlock } from 'chayns-api';

export function Editor({ isDirty }: { isDirty: boolean }) {
    const confirmLeave = useCallback(async () => {
        return !isDirty || window.confirm('Discard your changes?');
    }, [isDirty]);

    useChaynsHistoryBlock(confirmLeave, {
        isEnabled: isDirty,
        scope: 'local',
        isBeforeUnload: true,
    });

    return null;
}
```

### `useChaynsHistoryEvent(type, handler)`

Subscribes to low-level history events:

- `change`
- `popstate`

```tsx
useChaynsHistoryEvent('popstate', (event) => {
    console.log('Back/forward changed this layer', event);
});
```

## Imperative layer API

A `ChaynsHistoryLayer` supports:

```ts
layer.getRoute();
layer.setRoute(route, opts);

layer.getState();
layer.setState(state, opts);

layer.getParams();
layer.setParams(params, opts);

layer.getHash();
layer.setHash(hash, opts);

layer.navigate(opts);

layer.createChildLayer(id);
layer.getChildLayer(id);
layer.setActiveChild(id, init);
layer.getActiveChildId();
layer.destroyChildLayer(id);

layer.getSegmentCount();
layer.setSegmentCount(count);

layer.addBlock(callback, opts);
layer.addEventListener('change', handler);
layer.addEventListener('popstate', handler);
```

## Navigation behavior

### `pushState` vs `replaceState`

Most write operations create a new browser history entry by default.

Use `isReplace: true` when you want to update the current entry instead:

```tsx
await setRoute(['search'], { isReplace: true });
```

This is especially useful for:

- normalization
- initial synchronization
- filter changes that should not create a new entry

### Active-chain restriction

Most operations only work on layers that are currently in the active chain.

If a layer exists but is not active anymore, write operations can resolve as stale and are ignored.

### Atomic navigation

`navigate()` is the safest way to update several navigation properties at once because it commits them as one logical change.

Prefer:

```tsx
await navigate({
    route: ['checkout'],
    state: { step: 2 },
    params: { source: 'cart' },
});
```

over several separate calls when the values belong together.

## Working with layers

### Pattern: parent route with nested detail view

```tsx
import {
    useChaynsHistoryActiveChild,
    useChaynsHistoryChildLayer,
    ChaynsHistoryLayerOverrideProvider,
} from 'chayns-api';

function ProductPage() {
    const { activeChildId, setActiveChild } = useChaynsHistoryActiveChild();
    const detailsLayer = useChaynsHistoryChildLayer('details');

    return (
        <>
            <button onClick={() => void setActiveChild('details', { route: ['42'] })}>
                Open details
            </button>

            {activeChildId === 'details' && (
                <ChaynsHistoryLayerOverrideProvider layer={detailsLayer}>
                    <ProductDetails />
                </ChaynsHistoryLayerOverrideProvider>
            )}
        </>
    );
}
```

`ProductDetails` now resolves all history hooks against the `details` layer instead of the parent layer.

### When to use `ChaynsHistoryLayerProvider` vs `ChaynsHistoryLayerOverrideProvider`

- `ChaynsHistoryLayerProvider` changes both the React hook context and the module-level current-layer stack
- `ChaynsHistoryLayerOverrideProvider` only changes the React subtree context

In most application code, `ChaynsHistoryLayerOverrideProvider` is the safer choice for nested UI sections.

## History in hosted modules

`ChaynsHost` can give an embedded module its own history layer.

### Host side

```tsx
import { ChaynsHost } from 'chayns-api';

<ChaynsHost
    type="client-module"
    isHistoryEnabled
    historyChildId="orders"
    system={{
        scope: 'remote_app',
        url: 'https://example.com/v2.remoteEntry.js',
        module: './App',
    }}
    functions={functions}
    pages={pages}
    currentPage={currentPage}
    isAdminModeActive={false}
    site={site}
    user={user}
    device={device}
    language={language}
    parameters={parameters}
    customData={customData}
    environment={environment}
    dialog={dialog}
/>
```

What this does:

1. `ChaynsHost` resolves a parent layer
2. it creates or reuses the child layer `orders`
3. it passes that child layer into the hosted module
4. the module can use history hooks inside its own namespace

### Activating the module layer

Creating a child layer is not the same as activating it.

The parent layer must switch to that child:

```tsx
await parentLayer.navigate({
    activeChild: 'orders',
    activeChildInit: {
        route: ['list'],
        state: { tab: 'open' },
    },
});
```

This makes the child layer part of the active chain and therefore part of the URL.

### Module side

Inside the hosted module, the normal hooks work without additional setup as long as the module is wrapped in `ChaynsProvider`.

```tsx
import { ChaynsProvider, useChaynsHistoryRoute } from 'chayns-api';

function ModuleApp() {
    const { segments, setRoute } = useChaynsHistoryRoute();

    return (
        <button onClick={() => void setRoute(['details', '42'])}>
            Current: {segments.join('/')}
        </button>
    );
}

export default function AppWrapper(props) {
    return (
        <ChaynsProvider {...props}>
            <ModuleApp />
        </ChaynsProvider>
    );
}
```

### Important notes for modules

- History is opt-in. Set `isHistoryEnabled`.
- If you do not pass `historyChildId`, the hosted content shares the parent layer.
- A dedicated child layer is usually the better choice for reusable modules.
- The module only participates in navigation while its layer is active.

## History in hosted iframes

`ChaynsHost` also supports history for hosted iframes.

### Host side

```tsx
import { ChaynsHost } from 'chayns-api';

<ChaynsHost
    type="client-iframe"
    src="https://example.com/app"
    iFrameProps={{ name: 'myFrame' }}
    isHistoryEnabled
    historyChildId="embedded"
    functions={functions}
    pages={pages}
    currentPage={currentPage}
    isAdminModeActive={false}
    site={site}
    user={user}
    device={device}
    language={language}
    parameters={parameters}
    customData={customData}
    environment={environment}
    dialog={dialog}
/>
```

When history is enabled, the host exposes a history bridge to the iframe.

The iframe receives a `FrameHistoryLayer` proxy that:

- reads from a local cached snapshot
- forwards writes to the parent window
- receives `change` and `popstate` updates from the parent

### Iframe side

Inside the iframe application, `ChaynsProvider` automatically picks up the bridged history layer from `FrameWrapper`.

That means regular hooks work directly:

```tsx
import { ChaynsProvider, useChaynsHistoryNavigate } from 'chayns-api';

function IframeApp() {
    const navigate = useChaynsHistoryNavigate();

    return (
        <button
            onClick={() =>
                void navigate({
                    route: ['wizard', 'step-2'],
                    state: { step: 2 },
                })
            }
        >
            Next step
        </button>
    );
}

export default function AppWrapper() {
    return (
        <ChaynsProvider>
            <IframeApp />
        </ChaynsProvider>
    );
}
```

### Important limitation in iframes

`FrameHistoryLayer` does **not** support child-layer creation inside the bridge layer.

This means the following is not supported on the bridged iframe layer:

```ts
layer.createChildLayer('x');
```

If you need deeper sub-routing inside the iframe, manage it locally inside the iframe with your own root history layer and provide it explicitly to the relevant subtree.

Example pattern:

```tsx
import {
    ChaynsHistoryLayerOverrideProvider,
    getOrInitRootChaynsHistoryLayer,
    useChaynsHistoryLayer,
} from 'chayns-api';

function EmbeddedSection() {
    const outerLayer = useChaynsHistoryLayer(); // bridged host layer
    const localRoot = getOrInitRootChaynsHistoryLayer(undefined, 1).rootLayer;

    return (
        <ChaynsHistoryLayerOverrideProvider layer={localRoot}>
            <LocalRouter />
        </ChaynsHistoryLayerOverrideProvider>
    );
}
```

Use this pattern carefully. In most cases, the iframe should treat the bridged layer as its public navigation boundary and keep deeper view state internal.

## Manual root initialization

If you need direct control outside the default provider flow:

```tsx
import { initRootChaynsHistoryLayer } from 'chayns-api';

const { rootLayer } = initRootChaynsHistoryLayer({
    url: '/shop/products?filter=open#details',
    segmentCount: 1,
});
```

Options:

- `url`: useful for SSR
- `segmentCount`: how many path segments the root claims initially

There is also a singleton helper:

```tsx
import { getOrInitRootChaynsHistoryLayer } from 'chayns-api';

const { rootLayer } = getOrInitRootChaynsHistoryLayer('/shop/products', 1);
```

## Server-side rendering

For SSR, pass the current request URL when initializing the root history layer so the initial segments, params, and hash are correct on the first render.

With `ChaynsProvider`, this means:

```tsx
<ChaynsProvider
    isHistoryEnabled
    history={{
        url: req.url,
        segmentCount: 1,
    }}
>
    <App />
</ChaynsProvider>
```

## Blocking behavior

History blocks are checked before navigation is committed.

There are two scopes:

- `local`: only blocks navigation targeting the same layer
- `global`: also blocks navigation targeting ancestor layers while this layer is on the active chain

Use `global` when a nested layer should be able to protect the whole active flow.

### `beforeunload`

Set `isBeforeUnload: true` if the same condition should also prevent browser tab closes or reloads:

```tsx
useChaynsHistoryBlock(confirmLeave, {
    isEnabled: isDirty,
    scope: 'global',
    isBeforeUnload: true,
});
```

## Events

Two event types exist:

- `change`: emitted after a successful write operation on that layer
- `popstate`: emitted when browser back/forward applies a different history entry

Example:

```tsx
import { useChaynsHistoryEvent } from 'chayns-api';

useChaynsHistoryEvent('change', (event) => {
    console.log(event.layerId, event.segments, event.state);
});
```

Event payload:

```ts
type ChaynsHistoryLayerEvent = {
    type: 'change' | 'popstate';
    layerId: string;
    segments: string[];
    state: Record<string, unknown>;
    params: Record<string, string>;
    hash: string;
};
```

## Best practices

1. Use `navigate()` when route and state belong together.
2. Use dedicated child layers for hosted modules instead of sharing the root by default.
3. Keep `segmentCount` stable and intentional.
4. Use `isReplace: true` for synchronization and normalization steps.
5. Treat iframe history as a boundary layer; do not model deep child trees on the bridged frame layer.
6. Use `global` blocks only when the nested flow really owns the whole leave decision.

## Common pitfalls

### History is not working at all

Most often, history was not enabled.

Check:

- `ChaynsProvider isHistoryEnabled`
- `ChaynsHost isHistoryEnabled`

### Route hooks always return an empty array

Usually this means no layer claimed path segments yet.

Set a `segmentCount` on the relevant root or child layer.

### A module or iframe does not affect the URL

Usually the hosted child layer exists, but is not active.

Make sure the parent navigates to:

```tsx
await parentLayer.setActiveChild('child-id');
```

or:

```tsx
await parentLayer.navigate({ activeChild: 'child-id' });
```

### Query params disappear

`setParams()` replaces the current layer's params instead of merging them automatically.

Merge manually when needed.

### Reserved state keys

Do not write these keys yourself:

- `activeChild`
- `childState`
- `__params`
- `__hash`

They are managed by the history core.