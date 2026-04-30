# chaynsHistory — Usage Guide

Encapsulated history handling for chayns-api applications using Module Federation and iframes. Every "frame" (root app, module-federation child, iframe child) gets its own **HistoryLayer** that owns a slice of the URL and its own state — but all navigation is serialised through a single queue in the top window, so back/forward and navigation-blocking work reliably across frame boundaries.

---

## Architecture Overview

```
window.location.pathname
─────────────────────────────────────────────────────────────────────
  /  shop  /  products  /  detail
  ▲         ▲              ▲
  │         │              │
  root      child:shop     child:detail   ← each HistoryLayer owns N segments
  (segmentCount=1) (segmentCount=1) (segmentCount=1)

Memory tree (top window, authoritative):

  HistoryLayer "root"  (depth 0)
  ├── activeChildId: "shop"
  └── children:
       ├── HistoryLayer "shop"  (depth 1)
       │    ├── activeChildId: "detail"
       │    └── children:
       │         └── HistoryLayer "detail"  (depth 2)
       └── HistoryLayer "cart"  (depth 1, inactive — subtree preserved in memory)

history.state  →  { __chaynsHistory: { v:1, tree: { activeChild:"shop", childState:{…} } } }
                   + any existing foreign keys (untouched)

Sentinel pattern (one guard entry after every real entry):
  browser history stack:  [real₀] [sentinel₀★] [real₁] [sentinel₁]
                                                                  ▲ always sitting here
  Back press →  sentinel₀  →  block-check  →  allowed: skip to real₀
                                            →  blocked: stay on sentinel₀ (URL unchanged)
```

---

## Quick Start

### 1 — Top window initialisation

The root layer is created lazily on first access via the `getOrInitRootLayer()` singleton. For explicit control you can also call `initRootLayer()` directly:

```ts
import { getOrInitRootLayer } from 'chayns-api';

const { rootLayer } = getOrInitRootLayer();
// rootLayer is always segmentCount: 0
```

### 2 — Provide to React

Wrap your root component with `HistoryLayerProvider`:

```tsx
import { HistoryLayerProvider, getOrInitRootLayer } from 'chayns-api';

const { rootLayer } = getOrInitRootLayer();

function App() {
  return (
    <HistoryLayerProvider layer={rootLayer}>
      <Router />
    </HistoryLayerProvider>
  );
}
```

> **When using `ChaynsHost`** you don't need to add the provider yourself — it is wrapped automatically. Pass an explicit `layer` prop to `ChaynsHost` to use a specific child layer, or omit it to use the root layer.

---

## React Hooks

All hooks read from the nearest `<HistoryLayerProvider>` ancestor.

### `useRoute()`

```tsx
import { useRoute } from 'chayns-api';

function PageHeader() {
  const { segments, setRoute } = useRoute();
  // segments = ['shop']  (this layer's own URL segments)

  return (
    <nav>
      <button onClick={() => setRoute(['cart'])}>Cart</button>
      <button onClick={() => setRoute(['shop', 'sale'], { isReplace: true })}>Sale</button>
    </nav>
  );
}
```

Re-renders **only** when this layer's segments change.

---

### `useHistoryState<T>()`

```tsx
import { useHistoryState } from 'chayns-api';

interface FilterState { category: string; sort: 'asc' | 'desc' }

function ProductList() {
  const [filter, setFilter] = useHistoryState<FilterState>();

  return (
    <select
      value={filter?.sort ?? 'asc'}
      onChange={(e) => setFilter({ ...filter, sort: e.target.value as 'asc'|'desc' })}
    >
      <option value="asc">A → Z</option>
      <option value="desc">Z → A</option>
    </select>
  );
}
```

> ⚠️ Keys `activeChild` and `childState` are reserved — they are silently stripped with a dev warning.

---

### `useNavigate()`

Atomically update both route and state in one history entry:

```tsx
import { useNavigate } from 'chayns-api';

function ProductCard({ id }: { id: string }) {
  const navigate = useNavigate();

  return (
    <button onClick={() =>
      navigate({ route: ['detail', id], state: { scrollY: window.scrollY } })
    }>
      View details
    </button>
  );
}
```

---

### `useActiveChild()` / `useChildLayer()`

Use these together to render nested layers:

```tsx
import { useActiveChild, useChildLayer, HistoryLayerProvider } from 'chayns-api';

function TabHost() {
  const { activeChildId, setActiveChild } = useActiveChild();

  return (
    <>
      <nav>
        <button onClick={() => setActiveChild('overview')}>Overview</button>
        <button onClick={() => setActiveChild('settings')}>Settings</button>
      </nav>
      {activeChildId && (
        <TabPane tabId={activeChildId} />
      )}
    </>
  );
}

function TabPane({ tabId }: { tabId: string }) {
  // Creates the child layer on first render; does NOT destroy it on unmount.
  // Inactive subtrees stay in memory so switching tabs preserves their state.
  const childLayer = useChildLayer(tabId);

  return (
    <HistoryLayerProvider layer={childLayer}>
      <TabContent />
    </HistoryLayerProvider>
  );
}
```

---

### `useHistoryBlock(callback, opts?)`

Show a save prompt before the user navigates away:

```tsx
import { useHistoryBlock } from 'chayns-api';

function EditForm({ isDirty }: { isDirty: boolean }) {
  const confirmLeave = useCallback(async () => {
    if (!isDirty) return true;
    return window.confirm('Discard unsaved changes?');
  }, [isDirty]);

  // Only active when the form is dirty. Caller owns the stable ref.
  useHistoryBlock(confirmLeave, { isEnabled: isDirty });

  return <form>…</form>;
}
```

Options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `isEnabled` | `boolean` | `true` | Toggle the block without unmounting |
| `scope` | `'local' \| 'global'` | `'local'` | `local`: blocks only this layer's navigation. `global`: also blocks ancestor navigations (e.g. parent switching tabs). |
| `isBeforeUnload` | `boolean` | `false` | Also show the browser's native "leave page?" dialog on reload/close. |

> Callbacks must return a `Promise<boolean>`. A timeout of **30 seconds** counts as blocked. Rejections also count as blocked.

---

### `useHistoryEvent(type, handler)`

Low-level raw event subscription:

```tsx
import { useHistoryEvent } from 'chayns-api';

function Analytics() {
  useHistoryEvent('change', (e) => {
    trackPageView({ layerId: e.layerId, segments: e.segments });
  });
  return null;
}
```

---

## Imperative API (without React)

Every method is available on the `HistoryLayer` object directly:

```ts
// Set route
layer.setRoute(['products', 'shoes']);

// Replace instead of push
layer.setRoute(['products', 'hats'], { isReplace: true });

// Navigate (route + state atomically)
layer.navigate({ route: ['detail', '42'], state: { from: 'list' } });

// Read
const segments = layer.getRoute();         // ['detail', '42']
const state    = layer.getState();         // { from: 'list' }
const childId  = layer.getActiveChildId(); // null | string

// Children
const child = layer.createChildLayer('sidebar');
layer.setActiveChild('sidebar', { route: ['filters'], state: { open: true } });
layer.destroyChildLayer('sidebar');        // removes from tree + URL

// Blocking
const unblock = layer.addBlock(async () => confirm('Leave?'), { scope: 'local' });
unblock(); // remove the block

// Events
const off = layer.addEventListener('popstate', (e) => console.log(e));
off();
```

---

## URL & Layer Segment Counts

Each layer owns a fixed number of URL path segments (`segmentCount`). The root and each active child's segments are concatenated to form the full URL:

```
root  segmentCount=1  segments=['shop']
child segmentCount=2  segments=['products','shoes']
→  /shop/products/shoes
```

Segment count is set at init time or changed dynamically:

```ts
// Give a child layer 2 segments
const child = root.createChildLayer('catalog');
child.setSegmentCount(2);
root.setActiveChild('catalog', { route: ['products', 'all'] });
// → URL becomes /products/all
```

---

## Segment Inheritance and Active Child Preservation

Switching the active child **never destroys** the inactive subtree — it stays in memory. Switching back restores the full state:

```ts
root.setActiveChild('search', { route: ['query'], state: { q: 'shoes' } });
root.setActiveChild('cart');   // search subtree preserved in memory
root.setActiveChild('search'); // restores → URL contains ['query'], state.q = 'shoes'
```

Explicitly destroy a child to free its resources:

```ts
root.destroyChildLayer('search');
// - Removes from tree
// - Removes all registered blocks
```

---

## Blocking Scope Rules

| `scope` | Blocks navigations at… |
|---------|------------------------|
| `'local'` | **Only** the layer the block is registered on |
| `'global'` | The layer it's registered on **and all its ancestors** (parent switching tabs, etc.) |

> Global blocks are only collected from **active-chain descendants**, not inactive ones. An inactive sibling's block cannot prevent unrelated navigations.

---

## SSR Safety

All `window` / `history` accesses are guarded with `typeof window !== 'undefined'`. On the server:

- `initRootLayer` creates the tree but does not touch `window.history`.
- All hooks return safe defaults (`segments = []`, `state = undefined`, `activeChildId = null`).
- `useSyncExternalStore` receives `getServerSnapshot` implementations that return these defaults.

---

## DevTools & Debugging

In any non-production environment, a global is automatically installed on `window`:

```ts
// Browser console
window.__chaynsHistoryInspect.tree   // full layer tree snapshot
window.__chaynsHistoryInspect.queue  // pending navigation ops
```

The `initRootLayer` return value also exposes these directly:

```ts
const { rootLayer, __debugTree, __debugQueue } = initRootLayer();

console.log(__debugTree());  // { id: 'root', depth: 0, children: { … }, … }
console.log(__debugQueue()); // [{ kind: 'setRoute', layerId: 'shop', … }]
```

---

## API Reference

### `initRootLayer()` / `getOrInitRootLayer()`

`initRootLayer()` creates a new root layer (always with `segmentCount: 0`).  
`getOrInitRootLayer()` is a lazy singleton — prefer it in most cases.

Both return `{ rootLayer, __debugTree, __debugQueue }`.

---

### `HistoryLayer` interface

| Method | Description |
|--------|-------------|
| `id` | Unique identifier |
| `depth` | Nesting depth (root = 0) |
| `getSegmentCount()` | Number of URL segments this layer owns |
| `setSegmentCount(n)` | Change segment count; cascades overflow segments to children |
| `getRoute()` | Own URL segments |
| `setRoute(segs, opts?)` | Push/replace navigation with new segments |
| `getState<T>()` | Own state slice |
| `setState(state, opts?)` | Push/replace navigation with new state |
| `` | Atomically update route + state |
| `createChildLayer(id)` | Create and register a child layer |
| `destroyChildLayer(id)` | Remove child (frees blocks, notifies proxies) |
| `setActiveChild(id, init?)` | Switch active child; preserves inactive subtrees |
| `getActiveChildId()` | Currently active child id |
| `getChildLayer(id)` | Get a child layer by id |
| `addBlock(cb, opts?)` | Register navigation blocker; returns remove function |
| `addEventListener(type, handler)` | Subscribe to `'change'` or `'popstate'`; returns unsubscribe |

---

### React hooks summary

| Hook | Returns |
|------|---------|
| `useHistoryLayer()` | Nearest `HistoryLayer` from context |
| `useRoute()` | `{ segments, setRoute }` |
| `useHistoryState<T>()` | `[state, setState]` |
| `useNavigate()` | `navigate(opts)` function |
| `useHistoryBlock(cb, opts?)` | Registers block on mount, removes on unmount |
| `useHistoryEvent(type, handler)` | Raw event subscription |
| `useChildLayer(id)` | Creates child on mount, **does not destroy on unmount** |
| `useActiveChild()` | `{ activeChildId, setActiveChild }` |

---

## Reserved State Keys

`activeChild` and `childState` are managed internally. Passing them to `setState` strips them and emits a dev warning:

```ts
// ❌ these will be stripped silently in prod, warned in dev:
layer.setState({ activeChild: 'foo', childState: {}, myProp: 'ok' });

// ✅
layer.setState({ myProp: 'ok' });
```
