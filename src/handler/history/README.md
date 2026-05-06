# chaynsHistory — Developer Reference

A layered browser-history system for chayns apps. Each logical view in the app
owns its own **layer** — a node in a tree. Layers co-operate to project a single
URL and a single `window.history` state entry while remaining independently
navigable.

---

## Table of contents

1. [Mental model](#1-mental-model)
2. [Initialization](#2-initialization)
3. [Layer tree — creating and wiring layers](#3-layer-tree)
4. [Navigation API (imperative)](#4-navigation-api-imperative)
5. [React integration](#5-react-integration)
6. [Navigation blocking](#6-navigation-blocking)
7. [Events](#7-events)
8. [URL & state projection](#8-url--state-projection)
9. [Internal architecture](#9-internal-architecture)
10. [SSR](#10-ssr)
11. [Debug tooling](#11-debug-tooling)
12. [Complete worked example](#12-complete-worked-example)

---

## 1. Mental model

```
root layer          /shop
  └─ product layer  /shop/42
       └─ tab layer /shop/42/reviews
```

- Every layer owns **N URL path segments** (`segmentCount`).
- A layer can have multiple **child layers** but only one is **active** at a time.
- The **active chain** is the path from the root to the deepest active layer.
  Only layers on the active chain contribute segments to the projected URL.
- Each layer also owns its own slice of **query params** (merged across the chain)
  and the **hash fragment** (deepest non-undefined value wins).
- Every mutation goes through a single **NavigationQueue**, which serializes ops,
  runs block-checks, projects the new URL + state, and calls the appropriate
  `pushState` / `replaceState`.

---

## 2. Initialization

### Browser (call once at app startup)

```ts
import { initRootChaynsHistoryLayer } from 'chayns-api';

const { rootLayer } = initRootChaynsHistoryLayer();
```

The root layer:
- reads `window.location.pathname` to bootstrap child segments,
- seeds `window.history.state` with `__chaynsHistory` if it is absent,
- attaches a global `popstate` listener,
- installs `window.__chaynsHistoryInspect` (dev only).

#### Options

```ts
export interface InitRootChaynsHistoryLayerOptions {
  /** Current page URL. Browser: omit (uses window.location). SSR: pass req.url. */
  url?: string;
  /**
   * How many path segments the root layer itself owns.
   * When set, getRoute() is already populated on the first render — no extra
   * setSegmentCount() call needed.
   */
  segmentCount?: number;
}
```

### Singleton helper

```ts
import { getOrInitRootChaynsHistoryLayer } from 'chayns-api';

// Returns the same instance on every subsequent call.
const { rootLayer } = getOrInitRootChaynsHistoryLayer();
```

Use `getOrInitRootChaynsHistoryLayer` everywhere except the explicit startup
entry-point where you want to control options.

---

## 3. Layer tree

### Creating child layers

```ts
// Create a child manually (rarely needed outside hooks).
const productLayer = rootLayer.createChildLayer('product');
```

`createChildLayer` throws if a child with the same id already exists on that
parent. Use `getChildLayer` to check first, or use the React hook
[`useChaynsHistoryChildLayer`](#usechaynshistorychildlayer) which handles this
automatically.

### Destroying child layers

```ts
rootLayer.destroyChildLayer('product');
```

Destruction:
- marks the subtree as destroyed (all pending ops are discarded),
- removes all blocks registered in the subtree,
- if the destroyed layer was active, enqueues a `setActiveChild(null)` so the
  URL and subscribers are updated.

### Activating a child

Only one child per layer is active at a time. Set it with:

```ts
rootLayer.setActiveChild('product', {
  route: ['42'],          // optional: seed the child's initial segments
  state: { tab: 'info' }, // optional: seed the child's initial state
});

// Deactivate:
rootLayer.setActiveChild(null);
```

`setActiveChild` auto-creates the child if it does not yet exist.

### Segment count

A layer must declare how many URL segments it owns:

```ts
productLayer.setSegmentCount(1); // owns e.g. "42" in /shop/42
```

When `setSegmentCount` is called on an active layer the first time, it
automatically draws from the **bootstrap pool** (the pathname parsed at init
time) so the layer immediately has real segments on first render.

---

## 4. Navigation API (imperative)

All mutating calls are async under the hood (they enqueue an op) but you
typically do not need to `await` them.

### `setRoute(segments, opts?)`

Replace the layer's URL segments:

```ts
productLayer.setRoute(['99']);
productLayer.setRoute(['99'], { isReplace: true }); // replaceState instead of pushState
```

`opts` is `ChaynsHistoryNavigateOptions`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isReplace` | `boolean` | `false` | Use `replaceState` instead of `pushState` |
| `params` | `Record<string,string>` | — | Simultaneously update query params for this layer |
| `hash` | `string` | — | Simultaneously update hash fragment |

### `setParams(params, opts?)`

Replaces **all** query params owned by this layer:

```ts
layer.setParams({ page: '2', sort: 'asc' });
// Merge pattern:
layer.setParams({ ...layer.getParams(), newKey: 'val' });
```

`opts` is `ChaynsHistoryNavigationCommitOptions` (`{ isReplace?: boolean }`).

### `setHash(hash, opts?)`

```ts
layer.setHash('section-3');
layer.setHash(''); // explicitly clear
```

Leading `#` is stripped automatically.

### `setState(state, opts?)`

Persists arbitrary serializable data into `window.history.state` (nested under
`__chaynsHistory`). Reserved keys (`activeChild`, `childState`, `__params`,
`__hash`) are silently stripped.

```ts
layer.setState({ scrollTop: 320 });
```

### `navigate(opts)`

Atomic multi-field navigation — all fields are applied in a single op and a
single `pushState`/`replaceState`:

```ts
layer.navigate({
  route: ['99'],
  state: { scrollTop: 0 },
  params: { modal: 'share' },
  hash: 'top',
  isReplace: false,
});
```

### Reading current values (synchronous)

```ts
layer.getRoute();   // string[]
layer.getParams();  // Record<string, string>
layer.getHash();    // string  (never undefined — '' when unset)
layer.getState();   // T | undefined
layer.getActiveChildId(); // string | null
layer.getSegmentCount();  // number
```

---

## 5. React integration

### Providing a layer to a subtree

```tsx
import { ChaynsHistoryLayerProvider } from 'chayns-api';

function App() {
  const { rootLayer } = getOrInitRootChaynsHistoryLayer();
  return (
    <ChaynsHistoryLayerProvider layer={rootLayer}>
      <Router />
    </ChaynsHistoryLayerProvider>
  );
}
```

`ChaynsHistoryLayerProvider` does **two** things:
1. Sets React context so all hooks inside the subtree resolve to `layer`.
2. Pushes `layer` onto the module-level layer stack so `getCurrentChaynsHistoryLayer()`
   (used by non-React call sites) also returns the right layer.

### Overriding the layer for a React subtree only

```tsx
import { ChaynsHistoryLayerOverrideProvider } from 'chayns-api';

// Hooks inside the subtree resolve to `productLayer`.
// getCurrentChaynsHistoryLayer() is NOT affected — static/imperative code
// outside this tree still sees the outer layer.
<ChaynsHistoryLayerOverrideProvider layer={productLayer}>
  <ProductDetail />
</ChaynsHistoryLayerOverrideProvider>
```

Use this when embedding a feature in a host app that manages its own
layer stack independently.

### Static (non-React) layer access

```ts
import { getCurrentChaynsHistoryLayer } from 'chayns-api';

// Returns the innermost currently mounted layer, or the root layer as fallback.
const layer = getCurrentChaynsHistoryLayer();
layer.navigate({ route: ['home'] });
```

---

### Hooks

All hooks read from the nearest `ChaynsHistoryLayerProvider` / `ChaynsHistoryLayerOverrideProvider`
in the tree.

#### `useChaynsHistoryLayer`

Returns the nearest `ChaynsHistoryLayer`. Throws if no provider is found.

```ts
const layer = useChaynsHistoryLayer();
```

#### `useChaynsHistoryRoute`

```ts
const { segments, setRoute } = useChaynsHistoryRoute();
// segments: string[] — re-renders only when the array content changes.
// setRoute: (segments: string[], opts?) => void
```

#### `useChaynsHistoryParams`

```ts
const [params, setParams] = useChaynsHistoryParams();
// params: Record<string, string> — shallow-stable reference.
```

#### `useChaynsHistoryHash`

```ts
const [hash, setHash] = useChaynsHistoryHash();
```

#### `useChaynsHistoryState`

```ts
const [state, setState] = useChaynsHistoryState<{ scrollTop: number }>();
```

State object reference is stable between renders when shallowly equal.

#### `useChaynsHistoryNavigate`

```ts
const navigate = useChaynsHistoryNavigate();
navigate({ route: ['99'], params: { modal: 'share' } });
```

#### `useChaynsHistoryChildLayer`

Creates the child layer on mount if it does not exist yet. Does **not**
destroy it on unmount — call `layer.destroyChildLayer(id)` explicitly.

```ts
const productLayer = useChaynsHistoryChildLayer('product');
```

#### `useChaynsHistoryActiveChild`

```ts
const { activeChildId, setActiveChild } = useChaynsHistoryActiveChild();

setActiveChild('product', { route: ['42'] });
setActiveChild(null); // deactivate
```

#### `useChaynsHistoryBlock`

See [Navigation blocking](#6-navigation-blocking).

#### `useChaynsHistoryEvent`

See [Events](#7-events).

---

## 6. Navigation blocking

A **block** is an async callback that returns `true` (allow) or `false` (block).
All blocks applicable to a navigation target are run in parallel; if any returns
`false` the navigation is cancelled.

### Block scope

| `scope` | Which navigations are intercepted |
|---------|-----------------------------------|
| `'local'` (default) | Only navigations targeting **this layer** |
| `'global'` | Navigations targeting this layer **or any ancestor** (e.g. back/forward that would unmount this layer) |

### Imperative

```ts
const unblock = layer.addBlock(
  async () => {
    return await showConfirmDialog('Leave page?');
  },
  { scope: 'global', isBeforeUnload: false },
);

// Later — remove the block:
unblock();
```

### React hook

```tsx
import { useChaynsHistoryBlock } from 'chayns-api';

useChaynsHistoryBlock(
  useCallback(async () => {
    if (!isDirty) return true;
    return await confirm('Discard changes?');
  }, [isDirty]),
  { scope: 'global', isEnabled: isDirty },
);
```

`isEnabled` (default `true`) lets you conditionally register the block without
extra `useEffect` boilerplate.

### `beforeunload` integration

```ts
layer.addBlock(async () => true, { isBeforeUnload: true });
```

When any block with `isBeforeUnload: true` is registered, the
`BlockRegistry` attaches a `beforeunload` listener automatically and
removes it again when all such blocks are unregistered.

### Block timeout

A block callback that does not settle within **30 seconds** is treated as
blocked (dev warning issued). This prevents navigations from hanging
indefinitely if a dialog is never dismissed.

---

## 7. Events

### Imperative

```ts
const unsub = layer.addEventListener('change', (event) => {
  console.log(event.segments, event.params, event.hash, event.state);
});

// popstate = browser back/forward on this layer
const unsub2 = layer.addEventListener('popstate', (event) => { … });

// Cleanup:
unsub();
unsub2();
```

`ChaynsHistoryLayerEvent`:

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

### React hook

```tsx
import { useChaynsHistoryEvent } from 'chayns-api';

useChaynsHistoryEvent('change', useCallback((e) => {
  analytics.track('navigation', { segments: e.segments });
}, []));
```

---

## 8. URL & state projection

These are used internally by `NavigationQueue` and also exported for **host
integrations** and **SSR** use.

### `projectToUrl(root)`

Walks the active chain, concatenates all segments, merges params, picks the
deepest hash. Returns a full URL string including `?` and `#`.

```ts
import { projectToUrl } from 'chayns-api';

const url = projectToUrl(rootLayer); // e.g. "/shop/42/reviews?page=2#top"
```

### `parseFromUrl(url, root)`

Splits the incoming pathname across layers based on each layer's `segmentCount`.

```ts
import { parseFromUrl } from 'chayns-api';

const { perLayerSegments, pendingSegments } = parseFromUrl(
  '/shop/42/reviews',
  rootLayer,
);
// perLayerSegments: Map<layerId, string[]>
// pendingSegments: leftover segments not claimed by any layer
```

### `projectToState(root, existing?)`

Serializes the full memory tree into a plain object suitable for
`window.history.state`. Merges with `existing` to preserve foreign keys.

```ts
import { projectToState } from 'chayns-api';

const state = projectToState(rootLayer, window.history.state ?? {});
window.history.pushState(state, '', url);
```

### `applyStateToTree(root, raw)`

Deserializes a raw `window.history.state` value back onto the layer tree
(mutating). Returns the set of layer ids that changed.

```ts
import { applyStateToTree } from 'chayns-api';

const { changedLayerIds } = applyStateToTree(rootLayer, window.history.state);
```

### `diffIncomingState(root, raw)`

Like `applyStateToTree` but does **not** mutate. Used by the queue to find
the block target before committing a popstate.

### `hasChaynsHistoryState(raw)`

Returns `true` if `raw` contains a valid `__chaynsHistory` tree.

### Layer-tree helpers

```ts
import {
  getChaynsHistoryActiveChain,
  findChaynsHistoryLayerById,
  isInChaynsHistoryActiveChain,
} from 'chayns-api';

const chain = getChaynsHistoryActiveChain(rootLayer);      // ChaynsHistoryLayer[]
const layer = findChaynsHistoryLayerById(rootLayer, 'tab'); // ChaynsHistoryLayer | undefined
const active = isInChaynsHistoryActiveChain(productLayer); // boolean
```

---

## 9. Internal architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Application code / React hooks                                      │
│  layer.setRoute() / layer.navigate() / layer.setActiveChild()        │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ enqueue(op)
┌────────────────────────────▼─────────────────────────────────────────┐
│  NavigationQueue                                                     │
│  • Serializes all ops (single async loop)                            │
│  • For each op:                                                      │
│    1. Resolve the target layer                                       │
│    2. Run BlockRegistry.checkBlocks()                                │
│    3. Mutate layer tree (_setOwn* silent methods)                    │
│    4. commit() → projectToUrl + projectToState → pushState           │
│    5. layer._emit('change' | 'popstate')                             │
└──────┬─────────────────────────────────────────────────────┬─────────┘
       │                                                     │
┌──────▼──────────┐                              ┌──────────▼──────────┐
│  BlockRegistry  │                              │  ChaynsHistoryLayer │
│  • Per-layer    │                              │  tree (memory)      │
│    block sets   │                              │  • own segments     │
│  • local /      │                              │  • own state        │
│    global scope │                              │  • own params       │
│  • beforeunload │                              │  • own hash         │
│  • 30s timeout  │                              │  • activeChildId    │
└─────────────────┘                              │  • EventBus         │
                                                 └─────────────────────┘
```

### NavigationQueue

A strict FIFO async queue. Only one op runs at a time (`isRunning` flag). This
guarantees that block-checks are never interleaved and that `pushState` calls
happen in the correct order.

### NavigationIndex (`NavigationIndex.ts`)

A module-level monotonic counter (`currentIdx`) stamped into every history entry
as `__idx`. Also manages `silentGo` — `history.go(delta)` calls that must be
absorbed by the popstate handler without triggering a real navigation (used to
reverse the browser position after a blocked popstate).

### StateProjector

- `projectToState` → recursively walks the tree following `activeChild` links,
  serializes each layer's `ownState`, `__params`, `__hash`, `activeChild` into a
  nested `ChaynsHistoryLayerStateNode` stored under `__chaynsHistory.tree`.
- `applyStateToTree` / `diffIncomingState` → reverse operation.

### UrlProjector

- `projectToUrl` → concatenates segments from the active chain, merges params,
  picks the deepest hash. Pure function, no side-effects.
- `parseFromUrl` → distributes incoming URL segments across layers based on each
  layer's declared `segmentCount`.

### EventBus

A tiny typed pub/sub (`on` / `emit` / `clear`). Each `ChaynsHistoryLayer` owns
one bus scoped to `'change'` and `'popstate'` events. Listeners that throw are
caught and logged to console without interrupting other listeners.

---

## 10. SSR

Pass the current request URL when initializing:

```ts
// In your server entry point:
const { rootLayer } = initRootChaynsHistoryLayer({ url: req.url });
```

`hasWindow()` is checked throughout — all `window.*` calls are guarded.
`getRoute()`, `getParams()`, `getHash()`, `getState()` all work correctly on
the server after bootstrapping from the URL.

React hooks use `useSyncExternalStore` with a `getServerSnapshot` that returns
the same value as `getSnapshot`, so there are no hydration mismatches.

---

## 11. Debug tooling

Available in non-production builds only.

### Browser console

After `initRootChaynsHistoryLayer` runs, the following is available in devtools:

```js
window.__chaynsHistoryInspect.tree()   // full layer tree snapshot
window.__chaynsHistoryInspect.queue()  // pending navigation ops
```

### Programmatic

```ts
import { debugTree, debugQueue } from 'chayns-api';

console.log(debugTree(rootLayer));
console.log(debugQueue(queue)); // queue is from initRootChaynsHistoryLayer internals
```

---

## 12. Complete worked example

```tsx
// main.tsx — app entry point
import { initRootChaynsHistoryLayer, ChaynsHistoryLayerProvider } from 'chayns-api';
import { ShopPage } from './ShopPage';

const { rootLayer } = initRootChaynsHistoryLayer({ segmentCount: 1 });

export function App() {
  return (
    <ChaynsHistoryLayerProvider layer={rootLayer}>
      <ShopPage />
    </ChaynsHistoryLayerProvider>
  );
}
```

```tsx
// ShopPage.tsx — a page that owns one URL segment and hosts a child layer
import {
  useChaynsHistoryRoute,
  useChaynsHistoryChildLayer,
  useChaynsHistoryActiveChild,
  ChaynsHistoryLayerProvider,
} from 'chayns-api';
import { ProductDetail } from './ProductDetail';

export function ShopPage() {
  const { segments, setRoute } = useChaynsHistoryRoute();
  // segments[0] = current shop section, e.g. "featured"

  const productLayer = useChaynsHistoryChildLayer('product');
  const { activeChildId, setActiveChild } = useChaynsHistoryActiveChild();

  function openProduct(id: string) {
    setActiveChild('product', { route: [id] });
  }

  function closeProduct() {
    setActiveChild(null);
  }

  return (
    <div>
      <nav>
        <button onClick={() => setRoute(['featured'])}>Featured</button>
        <button onClick={() => setRoute(['new'])}>New Arrivals</button>
      </nav>

      <h1>Shop — {segments[0]}</h1>

      <button onClick={() => openProduct('42')}>Open product 42</button>

      {activeChildId === 'product' && (
        <ChaynsHistoryLayerProvider layer={productLayer}>
          <ProductDetail onClose={closeProduct} />
        </ChaynsHistoryLayerProvider>
      )}
    </div>
  );
}
```

```tsx
// ProductDetail.tsx — nested layer, blocks navigation when form is dirty
import {
  useChaynsHistoryRoute,
  useChaynsHistoryState,
  useChaynsHistoryBlock,
  useChaynsHistoryEvent,
} from 'chayns-api';
import { useCallback, useState } from 'react';

export function ProductDetail({ onClose }: { onClose: () => void }) {
  const { segments } = useChaynsHistoryRoute(); // segments[0] = product id
  const [state, setState] = useChaynsHistoryState<{ tab: string }>();
  const [isDirty, setDirty] = useState(false);

  // Block navigation away while the form is dirty.
  useChaynsHistoryBlock(
    useCallback(async () => {
      return window.confirm('You have unsaved changes. Leave anyway?');
    }, []),
    { scope: 'global', isEnabled: isDirty },
  );

  // React to browser back/forward on this layer.
  useChaynsHistoryEvent('popstate', useCallback((e) => {
    console.log('Restored tab:', e.state);
  }, []));

  return (
    <div>
      <h2>Product {segments[0]}</h2>
      <button onClick={() => setState({ tab: 'reviews' })}>Reviews</button>
      <button onClick={() => setState({ tab: 'info' })}>Info</button>
      <p>Active tab: {state?.tab ?? 'info'}</p>

      <input onChange={() => setDirty(true)} placeholder="Edit something..." />
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### Resulting URL shape

| Action | URL |
|--------|-----|
| App loads | `/featured` |
| Open product 42 | `/featured/42` |
| Switch tab (replaceState) | `/featured/42` (state blob updated) |
| Add filter param | `/featured/42?sort=price` |
| Browser back | `/featured` — `popstate` fires on `product` layer |
