# Copilot Instructions

## Build & Lint Commands

```bash
# Type-check only (fast validation, no emit)
npm run build:typescript -- --noEmit

# Full build (CJS + ESM + type declarations)
npm run prepublishOnly

# Build individual formats
npm run build:cjs       # CommonJS → dist/cjs/
npm run build:esm       # ESM → dist/esm/
npm run build:typescript  # Type declarations → dist/types/

# Watch mode (all formats in parallel)
npm run watch

# Lint
npm run lint

# Format
npm run format
```

> There are no tests in this repository.

## Architecture Overview

`chayns-api` is a React library that bridges chayns host environments (native apps, iframes, module federation) with React apps via hooks and functions.

### Core Abstraction: Wrapper Classes

The central abstraction is `IChaynsReact` (defined in `src/types/IChaynsReact.ts`). Four concrete implementations handle different runtime environments:

| Wrapper | Environment |
|---|---|
| `FrameWrapper` | Running inside an iframe embedded in a chayns host |
| `AppWrapper` | Running inside a chayns native app (Chayns, TobitChat, etc.) |
| `ModuleFederationWrapper` | Loaded via Module Federation as a remote module |
| `SsrWrapper` | Server-side rendering |

`ChaynsProvider` (`src/components/ChaynsProvider.tsx`) detects the environment at runtime and instantiates the appropriate wrapper. The wrapper is stored in a React context (`ChaynsContext`) and exposed to hooks via `useSyncExternalStore`.

### Data Flow

1. **ChaynsProvider** selects and initializes a wrapper, then exposes it via `ChaynsContext`
2. **FrameWrapper** communicates with the host page via [Comlink](https://github.com/GoogleChromeLabs/comlink) over `postMessage` (cross-origin iframe RPC)
3. **AppWrapper** communicates with native app shells via `invokeAppCall` (custom `window.chayns` API bridge)
4. All wrappers expose `.values` (reactive state), `.functions` (API calls), and `.customFunctions` (host-defined custom functions)
5. Hooks (`src/hooks/`) subscribe to context changes using `useSyncExternalStore` via the selector pattern in `src/hooks/context.ts`

### Hook Pattern

All hooks are built on three selectors in `src/hooks/context.ts`:
- `useValuesSelector(selector)` — read from reactive `values`
- `useFunctionsSelector(selector)` — read from `functions`
- `useCustomFunctionsSelector(selector)` — read from `customFunctions`

Example from `useUser.tsx`:
```ts
export const useUser = () => useValuesSelector((values) => values?.user);
```

### Host Embedding (`ChaynsHost`)

`src/host/ChaynsHost.tsx` is the **reverse** side: it renders child pages as iframes or Module Federation remotes, and passes data/functions down to them. It supports four modes via the `type` prop: `client-iframe`, `server-iframe`, `client-module`, `server-module`.

### Comlink & Nested Functions

`src/util/transferNestedFunctions.ts` registers a custom Comlink transfer handler that automatically serializes plain objects containing functions across `postMessage` boundaries. This file has a **side effect** (it mutates Comlink's global transfer handler registry) and is explicitly listed under `sideEffects` in `package.json`. It is imported at the top of `src/index.ts` to ensure it always runs.

## Key Conventions

- **Dual output format**: The library publishes both CJS (`dist/cjs/`) and ESM (`dist/esm/`) via Babel, plus type declarations via `tsc`. The `exports` field in `package.json` routes `require` to CJS and everything else to ESM.
- **No type downgrade on callbacks**: When wrapping functions across Comlink, always wrap callbacks with `comlink.proxy(callback)` — never pass raw functions over `postMessage`.
- **Prettier config** lives in `package.json`: single quotes, tab width 4, print width 2000 (effectively no line-length wrapping).
- **ESLint config** extends `@chayns-toolkit/eslint-config` — configured via `eslint.config.mjs`.
- **`AppWrapper` is intentionally untyped** (`// @ts-nocheck`, `/* eslint-disable */`) because it directly calls the legacy `window.chayns` JS API with loose types.
- **SSR data hydration**: `ChaynsProvider` serializes initial data into a `<script id="__CHAYNS_DATA__" type="application/json">` tag (escaped with `htmlescape`) so `FrameWrapper` can read it on the client without an extra round-trip.
- **Multiple `ChaynsProvider` instances** are supported: each registers itself in the global `chaynsApis` map (keyed by `chaynsApiId`) and the `moduleWrapper` ref always points to the most recently mounted one.
