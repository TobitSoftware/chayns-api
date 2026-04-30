# Implementation Plan: Encapsulated History Handling for Module Federation + iframes

> **Audience:** AI coding agent implementing this feature inside an existing chayns-api / chaynsHost codebase.
> **Stack:** React, Module Federation, iframes, chayns-api, chaynsHost (existing bridge for static functions/hooks between root and child layers).
> **Goal:** Add nested, encapsulated history handling (route + state + blocking + listeners) to the existing chaynsHost.

---

## 0. Conventions & Ground Rules

- **Language:** TypeScript, strict mode.
- **No new runtime dependencies.** Use existing chaynsHost bridge for cross-frame communication.
- **SSR:** Out of scope for logic, but every `window`/`document`/`history` access MUST be guarded with `typeof window !== 'undefined'`. On server, public APIs are no-ops or return safe defaults.
- **Naming prefix:** All new internal symbols use `chaynsHistory` / `__chaynsHistory`.
- **Reserved state keys:** `activeChild`, `childState`. Must never be writable by user code via `setState`.
- **Public API surface** lives under `chaynsHost.history`.
- **All navigation-producing operations go through ONE serial queue** in the top window.
- **Top-window owns truth.** iframes hold proxies that delegate via existing bridge.

---

## 1. File / Module Layout

Create the following structure inside the chaynsHost package (adapt path to repo):

```
src/history/
  index.ts                  // public exports
  types.ts                  // shared types & interfaces
  core/
    HistoryLayer.ts         // class implementation (real layer, top window)
    LayerTree.ts            // tree management, active chain traversal
    UrlProjector.ts         // segments <-> URL string
    StateProjector.ts       // memory tree <-> window.history.state
    NavigationQueue.ts      // serial queue for all nav ops
    Sentinel.ts             // sentinel push/detect/correct logic
    BlockRegistry.ts        // local + global blocks, beforeunload counter
    EventBus.ts             // per-layer pub/sub for change & popstate
    diff.ts                 // shallow diff helpers
  proxy/
    ProxyHistoryLayer.ts    // iframe-side proxy layer
    bridgeProtocol.ts       // message types, request/response helpers
  react/
    HistoryLayerContext.tsx
    hooks.ts                // useRoute, useHistoryState, useNavigate, etc.
  guards/
    ssr.ts                  // safe-window helpers
    devWarn.ts              // dev-only warnings
  __tests__/
    ...                     // see Phase 9
```

Public exports from `src/history/index.ts`:

```ts
export type { HistoryLayer, NavigateOptions, BlockOptions, HistoryLayerEvent } from './types';
export {
  HistoryLayerProvider,
  useHistoryLayer,
  useRoute,
  useHistoryState,
  useNavigate,
  useHistoryBlock,
  useHistoryEvent,
  useChildLayer,
  useActiveChild,
} from './react/hooks';
```

Wire into chaynsHost so it exposes:

```ts
chaynsHost.history = {
  getRootLayer(): HistoryLayer;     // top window only, throws otherwise
  getOwnLayer(): HistoryLayer;      // returns real layer in top window, proxy in iframe
  __debugTree(): unknown;           // dev only
};
```

---

## 2. Type Definitions (`types.ts`)

Implement exactly this surface — do not deviate without flagging it:

```ts
export type NavigateOptions = { replace?: boolean };

export type BlockOptions = {
  scope?: 'local' | 'global';        // default 'local'
  beforeUnload?: boolean;            // default false
};

export type HistoryLayerEvent = {
  type: 'change' | 'popstate';
  layerId: string;
  segments: string[];
  state: Record<string, unknown> | undefined;
};

export type LayerStateNode = {
  activeChild?: string;
  childState?: LayerStateNode;
  [key: string]: unknown;
};

export interface HistoryLayer {
  readonly id: string;
  readonly depth: number;

getSegmentCount(): number;
  setSegmentCount(n: number): void;

createChildLayer(id: string): HistoryLayer;
  destroyChildLayer(id: string): void;
  setActiveChild(
    id: string | null,
    init?: { route?: string[]; state?: Record<string, unknown> }
  ): void;
  getActiveChildId(): string | null;
  getChildLayer(id: string): HistoryLayer | undefined;

getRoute(): string[];
  setRoute(segments: string[], opts?: NavigateOptions): void;

getState<T = Record<string, unknown>>(): T | undefined;
  setState<T extends Record<string, unknown>>(state: T, opts?: NavigateOptions): void;

navigate(opts: {
    route?: string[];
    state?: Record<string, unknown>;
  } & NavigateOptions): void;

addBlock(
    callback: () => Promise<boolean>,
    opts?: BlockOptions
  ): () => void;

addEventListener(
    type: 'popstate' | 'change',
    handler: (e: HistoryLayerEvent) => void
  ): () => void;
}
```

---

## 3. Phased Implementation

Implement strictly in this order. After each phase, all unit tests for that phase MUST pass before moving on.

### Phase 1 — Static Core (no React, no iframe, no blocking)

**Files:** `LayerTree.ts`, `HistoryLayer.ts`, `UrlProjector.ts`, `StateProjector.ts`, `EventBus.ts`, `diff.ts`, `guards/ssr.ts`.

**Tasks:**

1. Implement `HistoryLayer` class with:
    - id, depth, parent ref, children map (insertion-ordered), activeChildId.
    - segments array, ownState object, segmentCount.
    - EventBus instance for `change` & `popstate`.
2. Implement `LayerTree` helpers:
    - `getActiveChain(root): HistoryLayer[]` — walks active chain.
    - `findLayerById(root, id)`.
    - `isInActiveChain(layer)`.
3. Implement `UrlProjector`:
    - `projectToUrl(root): string` — concatenate segments along active chain.
    - `parseFromUrl(url, root): { perLayerSegments }` — splits incoming URL onto layers based on each layer's `segmentCount`. Excess trailing segments are stored in a "pending" buffer on the deepest current layer.
4. Implement `StateProjector`:
    - `projectToState(root): { __chaynsHistory: { v:1, tree: LayerStateNode } }` — recursive build along active chain. Reserved keys auto-injected.
    - `applyStateToTree(root, raw)` — recursive apply, mutates layer tree.
    - **Inactive subtrees:** keep them in memory only in this phase (no `inactive` serialization yet — that's Phase 7 optional).
5. Implement `setRoute`, `setState`, `setActiveChild`, `setSegmentCount` **without** queue or blocks yet — direct calls. Behavior:
    - Reserved-key filter for `setState` (drop `activeChild`, `childState` if present, dev-warn).
    - Active-chain check: if not in active chain → no-op + dev-warn.
    - On change: build URL + state, call `pushState`/`replaceState`, fire `change` event filtered by self-diff (segments OR ownState shallow-changed).
6. **Active-child preservation:** `setActiveChild` MUST NOT remove the previous child from `children`. Only `destroyChildLayer(id)` removes.
    - On switching back to a previously active child, its segments / ownState / activeChild / descendants must still be intact.
    - Test: switch A → B → A and assert A's full subtree restored in URL.
7. Mount entry point: `initRootLayer({ segmentCount }): HistoryLayer`
    - Reads `window.location.pathname` and `window.history.state`.
    - If `__chaynsHistory` missing → `replaceState` with empty tree.
    - Returns root layer.

**Phase 1 acceptance:**
- Can create root + nested children, set routes, see URL update.
- Switching active children preserves inactive subtree state.
- Reserved state keys cannot be overwritten.
- All `window`/`history` access guarded for SSR.

---

### Phase 2 — Navigation Queue & Popstate

**Files:** `NavigationQueue.ts`, extend `HistoryLayer.ts`.

**Tasks:**

1. Implement `NavigationQueue` (top window singleton):
    - `enqueue(op): Promise<NavResult>` — appends, kicks `tick()`.
    - `tick()` — while queue non-empty, await `process(op)` sequentially.
    - `process(op)` switch on op kind: `setRoute | setState | setActiveChild | navigate | popstate | sentinelCorrection`.
2. Refactor all public mutators on `HistoryLayer` to enqueue ops instead of acting directly. Mutators return `void` to user, but internally hold the promise for chaining.
3. **Reentrancy guard:** if `enqueue` called while `running === true` from inside an event handler, op is appended (not awaited synchronously). Documented behavior: change-listener-triggered navigation runs after current op completes.
4. **Stale-op guard:** before processing, verify target layer still exists and (for non-popstate ops) is in active chain. Otherwise drop with dev-warn.
5. Wire `window.addEventListener('popstate', handler)` in top window only. Handler enqueues a `popstate` op with the raw state and computed direction.
6. Implement `process('popstate')`:
    - Diff incoming `__chaynsHistory.tree` vs current memory tree.
    - For each layer where own segments OR own state changed, fire `popstate` event.
    - Update memory tree to reflect new state.
    - Active-child changes counted as own-prop change → fire on parent.
    - **Inactive subtree preservation on popstate:** if a previously active child becomes inactive in the new state, do NOT discard its in-memory subtree (it may still be reachable later if user navigates forward).
7. **Coalescing (optional but recommended):** within same microtask, merge multiple `setRoute`/`setState` ops on same layer into a single push.

**Phase 2 acceptance:**
- Two parallel `setRoute` calls produce two deterministic, sequential pushes.
- Browser back/forward fires correct `popstate` events on correct layers.
- No layer that is unaffected by a change receives a `change` or `popstate` event.

---

### Phase 3 — Blocking & Sentinel

**Files:** `BlockRegistry.ts`, `Sentinel.ts`, extend `NavigationQueue.ts`.

**Tasks:**

1. `BlockRegistry`:
    - Per-layer `blocks: Map<id, BlockEntry>`.
    - Root-level `globalBlockIndex: Map<layerId, Set<BlockEntry>>`.
    - `addBlock(layer, cb, opts) → removeFn`.
    - `collectApplicableBlocks(targetLayer): BlockEntry[]`:
        - All `local` blocks on `targetLayer`.
        - All `global` blocks registered on `targetLayer` OR any descendant of it.
          (Rule restated: global blocks affect navigations at their layer and above, never below.)
2. `checkBlocks(targetLayer): Promise<boolean>`:
    - Run all callbacks via `Promise.all`.
    - Wrap each in 30s timeout → timeout counts as blocked, dev-warn.
    - Wrap each in try/catch → rejection counts as blocked.
    - Return `results.every(Boolean)`.
3. Integrate into queue: every `setRoute | setState | setActiveChild | navigate | popstate` op runs `checkBlocks` first. If blocked:
    - For programmatic ops: drop op, resolve with `{ ok: false, reason: 'blocked' }`.
    - For popstate: trigger sentinel correction (see below).
4. **Sentinel mechanism (`Sentinel.ts`):**
    - After every successful real push, immediately push a sentinel entry: same URL, state `{ __chaynsHistory: { ..., __sentinel: true, realRef: <id> } }`.
    - On init, also push a sentinel after the initial replace.
    - Popstate handler detects `state.__sentinel === true`:
        - Determine direction (back vs forward) by tracking last known index (maintain a counter `currentIdx` that increments on push, adjust on `history.go`).
        - Run block check for the *intended* navigation (the real entry on the other side of the sentinel).
        - If passes: `history.go(±1)` to skip sentinel onto real entry, then push a fresh sentinel after.
        - If blocked: do nothing (we sit on sentinel; URL appears unchanged to user).
5. **`beforeunload`:**
    - Counter on root for blocks with `beforeUnload: true`.
    - When counter > 0, attach a single `beforeunload` listener doing `e.preventDefault(); e.returnValue = ''`.
    - Detach when counter returns to 0.
6. **Forward navigation blocking:** verify symmetry — sentinel pattern works in both directions because we always have a sentinel on each side of a real entry after Phase 3 init.

**Phase 3 acceptance:**
- Local block prevents own-layer navigation only.
- Global block at depth N prevents navigation at N and all ancestors but not at descendants.
- Browser back during open block dialog: URL stays stable (sentinel), correct outcome on confirm/cancel.
- Refresh attempt while `beforeUnload` block active → browser confirmation shown.
- Multiple blocks: all run in parallel; any single false → blocked.

---

### Phase 4 — iframe Proxy

**Files:** `ProxyHistoryLayer.ts`, `bridgeProtocol.ts`.

**Tasks:**

1. Define bridge message types in `bridgeProtocol.ts`:
    - Requests: `LAYER_SET_ROUTE`, `LAYER_SET_STATE`, `LAYER_SET_ACTIVE_CHILD`, `LAYER_NAVIGATE`, `LAYER_ADD_BLOCK`, `LAYER_REMOVE_BLOCK`, `LAYER_GET_SNAPSHOT`, `LAYER_SET_SEGMENT_COUNT`, `LAYER_CREATE_CHILD`, `LAYER_DESTROY_CHILD`.
    - Events (parent → child): `LAYER_EVENT_CHANGE`, `LAYER_EVENT_POPSTATE`, `LAYER_BLOCK_INVOKE` (with response correlation id).
2. Implement `ProxyHistoryLayer` mirroring `HistoryLayer` interface.
    - All mutators send a request through the existing chaynsHost bridge.
    - Subscriptions store local listeners; bridge events dispatch to them.
    - `getRoute`/`getState`/`getActiveChildId` etc. read from a locally cached snapshot, kept in sync via change/popstate events.
    - `addBlock` registers the callback locally, sends registration to parent. When parent invokes via bridge, proxy executes the callback and replies with the boolean. **Parent-side timeout still 30s.**
3. Top-window side: when `getOwnLayer` is requested from an iframe via bridge, ensure the layer exists in the tree (parent must have called `createChildLayer` for it). Return a snapshot + subscribe path.
4. **iframe reload:** parent retains the layer; on iframe re-attach, send full snapshot back to the new proxy.
5. **Drop-on-destroy:** when parent destroys a child layer, send a `LAYER_DESTROYED` event so the proxy can throw on further calls.

**Phase 4 acceptance:**
- iframe can call `setRoute` and observe URL change in top window.
- iframe-registered block prevents top-window navigation.
- iframe reload restores its previous layer state.

---

### Phase 5 — React Hooks

**Files:** `react/HistoryLayerContext.tsx`, `react/hooks.ts`.

**Tasks:**

1. `HistoryLayerContext` — Context whose value is `HistoryLayer | null`.
2. `<HistoryLayerProvider layer={...}>` component.
3. `useHistoryLayer()`:
    - Reads context; if null, falls back to `chaynsHost.history.getOwnLayer()`.
    - Throws in dev if neither available.
4. All reactive hooks use `useSyncExternalStore`:
    - `useRoute()` → subscribes to `change` + `popstate` filtered to segment changes; returns `{ segments, setRoute }`.
    - `useHistoryState<T>()` → subscribes to own-state changes; returns `[state, setState]`.
    - `useNavigate()` → returns memoized navigate function (calls `layer.navigate`).
    - `useHistoryBlock(cb, opts)` → registers on mount, unregisters on cleanup. Supports `enabled` flag (registers only when true). Memoizes by `cb` identity — caller responsible for stable refs (document this).
    - `useHistoryEvent(type, handler)` → low-level listener subscription.
    - `useChildLayer(id)` → on mount calls `createChildLayer(id)` if not present; returns the child. On unmount: do NOT destroy automatically (caller decides via explicit API to keep inactive subtree alive).
    - `useActiveChild()` → `[activeChildId, setActiveChild]`.
5. `useSyncExternalStore` `getServerSnapshot` returns safe defaults (empty segments, undefined state).

**Phase 5 acceptance:**
- Component re-renders only when its own layer's relevant slice changes.
- Block hook unregisters on unmount.
- Hooks safe to call during SSR (no window access).

---

### Phase 6 — Edge Cases & Safe Guards

Implement / verify each item; add a regression test for each:

1. `setRoute` from inactive layer → no-op + dev-warn.
2. `setSegmentCount` decrease while active → excess segments cascade to children; emit `change` events on affected layers only.
3. Layer unmount with active block → block auto-removed.
4. `__chaynsHistory` absent in `history.state` → `replaceState` initial tree, no data loss for foreign keys (merge, don't overwrite).
5. Block callback throws → counts as blocked, dev-warn.
6. Block callback timeout (30s) → counts as blocked, dev-warn.
7. Duplicate `createChildLayer(id)` → throws.
8. SSR: every public method either works pure (e.g., `getRoute` from injected URL if provided to `initRootLayer`) or is a safe no-op.
9. `setState` with reserved keys → keys filtered, dev-warn.
10. Navigation while another navigation is in queue → serialized; documented order.
11. `popstate` to a state without `__chaynsHistory` (foreign push) → ignore + dev-warn, keep memory tree as truth.
12. Forward navigation past sentinel works symmetrically to back.

---

### Phase 7 — Optional: Persisted Inactive Subtrees

(Default off; activate via `persistInactive: true` on `initRootLayer` or per-layer.)

**Tasks:**

1. Extend `StateProjector`:
    - When projecting, also serialize inactive direct-child subtrees under `inactive[parentId][childId]`.
    - On `applyStateToTree`, restore inactive subtrees into memory.
2. Size-cap with dev-warn at >256KB serialized state.
3. Test: full reload of a deep nested page restores exact URL plus inactive sibling state.

---

### Phase 8 — DevTools & Debug Helpers

1. `chaynsHost.history.__debugTree()` — returns plain JSON snapshot of full layer tree (memory truth).
2. `chaynsHost.history.__debugQueue()` — current queue contents.
3. `devWarn(code, msg, data)` central helper, gated by `process.env.NODE_ENV !== 'production'`.
4. Optional: window-global `__chaynsHistoryInspect = { tree, queue, blocks }` in dev for browser console debugging.

---

### Phase 9 — Testing Strategy

#### Unit tests
- `LayerTree`: traversal, active chain, find by id.
- `UrlProjector`: round-trip URL ↔ tree for various segment counts including 0.
- `StateProjector`: round-trip including reserved keys, inactive subtrees.
- `BlockRegistry`: scope rules (local vs global; ancestor vs descendant).
- `NavigationQueue`: serialization, stale-op drop, reentrancy.
- `Sentinel`: detection, correction direction, init push.
- `diff`: shallow diff correctness.

#### Integration tests (jsdom)
- Single-layer setRoute → URL & state.
- Multi-layer setRoute, only affected layers re-render.
- Active-child switch preserves inactive subtree.
- Block scenarios A–E (from concept doc): async block + back race, parallel `setRoute`, two-layer same-tick, sentinel × setRoute, iframe-proxy latency (mocked bridge).
- `beforeunload` counter attach/detach.
- popstate diff correctness.
- Reserved-key filter.

#### React tests (RTL)
- Hook re-render scoping.
- `useHistoryBlock` enabled-toggle.
- `useChildLayer` does not destroy on unmount.
- SSR snapshot returns safe defaults (`renderToString` does not throw).

#### Cross-frame tests (mocked bridge)
- Proxy ↔ real layer via fake postMessage.
- iframe block invoked from parent via bridge.
- iframe reload restores snapshot.

---

## 4. Implementation Order Summary

1. Phase 1 — Static Core
2. Phase 2 — Navigation Queue & Popstate
3. Phase 3 — Blocking & Sentinel
4. Phase 4 — iframe Proxy
5. Phase 5 — React Hooks
6. Phase 6 — Edge Cases & Safe Guards
7. Phase 7 — Optional Persisted Inactive Subtrees
8. Phase 8 — DevTools
9. Phase 9 — Testing (concurrent with each phase, finalize here)

Each phase ends with: lint clean, type-check clean, tests green, manual smoke run in a sample app exercising the feature added in that phase.

---

## 5. Definition of Done

- All public API methods implemented per `types.ts`.
- All Phase 1–6 acceptance criteria met.
- Test coverage ≥ 90% on `src/history/core/**`.
- No use of `any` in public types.
- All `window`/`document`/`history` accesses behind SSR guards.
- README in `src/history/README.md` with:
    - Architecture overview diagram (ASCII tree).
    - API reference for public hooks and `chaynsHost.history`.
    - Example: nesting two iframes with sibling switching and a save-prompt block.
    - Migration notes (if any APIs replaced).
- `__debugTree()` and `__debugQueue()` available in dev.
- No new runtime dependencies added to package.json.

---

## 6. Non-Goals

- SSR-rendered routing (server-driven). Only safe no-ops/guards.
- Browser-history compression / dedup beyond microtask coalescing.
- Built-in route matching / param parsing (consumers wrap as needed).
- Animation / transition coordination.

---

## 7. Open Questions to Surface to Maintainer Before Coding

(Agent should ask before starting if any answer is unclear in repo context.)

1. Exact path/package for chaynsHost integration and existing bridge API surface used by proxies.
2. Whether iframe proxies must support being initialized before the parent has created their layer (race on iframe early load).
3. Default `segmentCount` for root layer (probably configured by host app — need a hook).
4. Browser support matrix (affects `useSyncExternalStore` polyfill choice if React < 18).
5. Whether existing chayns-api routing must be migrated/aliased onto the new system or coexist.
