# Module Federation

Module Federation is an advanced webpack feature (implemented via `@module-federation/enhanced`) that enables JavaScript applications to be dynamically loaded at runtime and shared between different applications.

## What is Module Federation?

Module Federation allows combining different independently built and deployed applications into a single large system. Instead of bundling all modules at build time, modules can be dynamically loaded at runtime.

### Key Benefits

- **Independent Deployments**: Different teams can build and deploy their applications independently
- **Code Sharing**: Shared dependencies (e.g., React) are loaded and shared only once
- **Lazy Loading**: Modules are loaded only when needed
- **Scalability**: Large applications can be split into smaller, independent parts

## Module Federation in chayns-api

chayns-api uses Module Federation to load external modules (so-called "remotes") at runtime. This is primarily achieved through the `ChaynsHost` component with the `client-module` or `server-module` type.

### Security Restrictions

:::warning Trusted Domains
For security reasons, modules can **only be loaded from Trusted Domains**. This restriction is enforced by the `TrustedDomainsPlugin`, which prevents code from untrusted sources from being executed.
:::

The list of Trusted Domains is defined by the chayns system and cannot be extended by developers. This means:

- **Internal Tobit Applications**: Can load modules from Tobit domains (e.g., for shared functionality between different chayns applications)
- **External Customers**: Cannot use Module Federation **for loading external modules**
- **Exception**: External customers can theoretically use Module Federation *within their own application* if the application becomes large enough to justify splitting it into multiple independent parts (very rare use case)

## Setup

### 1. Initialize Module Federation Sharing

Before using Module Federation, the sharing functionality must be initialized. This should happen as early as possible in the application (e.g., in `index.ts` or a `bootstrap.ts` file):

```typescript
import { initModuleFederationSharing } from 'chayns-api';

initModuleFederationSharing({ 
    scope: 'my_project_name' // should be identical to package.json name in snake_case
});
```

:::info When is initialization necessary?
Initialization is required when:
- Your application uses `ChaynsHost` with `client-module` or `server-module` type
- Your application is exported as a module itself
- **Not** required when your application is already embedded as a module elsewhere (e.g., in a dialog)
:::

### 2. Loading Modules with ChaynsHost

To load an external module, use the `ChaynsHost` component with the appropriate type:

```tsx
import { ChaynsHost } from 'chayns-api';

<ChaynsHost
    type="client-module"
    system={{
        scope: 'remote_project',      // Name of the remote project
        url: 'https://example.com/v2.remoteEntry.js',  // URL to remote entry
        module: './Component',         // Export to load
    }}
    loadingComponent={<div>Loading...</div>}
    // ... additional props (values and functions)
/>
```

### System Configuration

The `system` property defines the module to load:

- **`scope`**: The name of the remote project (from its `package.json`, in snake_case)
- **`url`**: URL to the `v2.remoteEntry.js` of the remote project
- **`module`**: The export to load (e.g., `'./Component'`)
- **`serverUrl`** (optional): URL for server-side rendering
- **`preventSingleton`** (optional): Prevents singleton behavior for this module

### 3. Exporting Components for Module Federation

When creating a component that will be loaded via Module Federation, you should:

1. **Export it as default export**
2. **Wrap it with `withCompatMode`** to ensure React version compatibility
3. **Accept `ChaynsProviderProps` and spread them to `ChaynsProvider`**

```tsx
import { ChaynsProvider, withCompatMode, type ChaynsProviderProps } from 'chayns-api';

const AppWrapper = (props: ChaynsProviderProps) => {
    return (
        <ChaynsProvider {...props}>
            <div>My Module Federation Component</div>
        </ChaynsProvider>
    );
};

export default withCompatMode(AppWrapper);
```

The `withCompatMode` wrapper automatically handles React version differences between the host application and your module. This ensures your component works correctly even if the host uses a different React version.

## Registering a Module Federation Page

To register a page that uses Module Federation in the chayns system, the process is similar to creating a regular page (as shown in the [Getting Started](/) guide). 

### Configuration Steps

1. Create a new page in your chayns site
2. Check the **"Api V5"** checkbox (required for chayns-api)
3. Enter the URL in the Module Federation format (instead of a regular URL)

### URL Format

For Module Federation pages, use the following format:

```
scope:module@url
```

Where:
- **`scope`**: Your package name in snake_case
  - Remove `@` characters
  - Replace `/` with `__`
- **`module`**: The key from `exposeModules` in your `toolkit.config`
  - Omit the `./` prefix
- **`url`**: The URL to your `v2.remoteEntry.js` file

### Examples

**Simple package name:**
```
my_app:AppWrapper@https://example.com/v2.remoteEntry.js
```

**Scoped package name** (e.g., `@chayns/example-app`):
```
chayns__example_app:AppWrapper@https://example.com/v2.remoteEntry.js
```

This tells the chayns system to load the `AppWrapper` module (from `exposeModules` in your toolkit config) from your remote entry at runtime.

## Use Cases

### Internal Tobit Usage

Module Federation is used at Tobit to:
- Share common UI components between different chayns applications
- Split large applications into smaller, maintainable parts
- Dynamically load functionality
- Load dialog content from other applications

### External Customers (Theoretical)

External customers could theoretically use Module Federation to:
- Split a very large application into multiple independent build artifacts
- Allow teams within the organization to work independently
- Deploy different parts of the application independently

:::caution Limited Use
This is a very rare use case. Most applications benefit more from normal code splitting and lazy loading. Module Federation only makes sense for very large applications with multiple independent teams.
:::

## Shared Dependencies

chayns-api automatically provides the following shared dependencies:

- **React** (version from the host application)
- **ReactDOM** (including `/client` and `/server` exports)

These are shared via the Module Federation runtime, so each library is loaded only once, even if multiple modules use them.


## Troubleshooting

### Module Not Loading

If a module isn't loading, check:
1. Has `initModuleFederationSharing` been called?
2. Is the `url` correct and reachable?
3. Is the domain included in the Trusted Domains? (check browser console for `TrustedDomainsError`)
4. Is the `scope` correct (should match the name in the remote project's `package.json`)?

### TrustedDomainsError

```
TrustedDomainsError: Remote entry https://example.com/v2.remoteEntry.js is not in trusted domains
```

This error means that the URL is not included in the list of Trusted Domains. This is a security measure and cannot be bypassed.

### React Version Compatibility

When different modules use different React versions, chayns-api automatically detects version compatibility. If a module requires an incompatible React version, the **Compat Mode** is automatically activated. This creates a new React tree with its own `createRoot`, isolating the module and preventing conflicts.

This automatic handling ensures that modules with different React versions can coexist without issues. However, for optimal performance, it's recommended to use compatible React versions across all modules when possible.

## Further Resources

- [Module Federation Documentation](https://module-federation.io/)
- [@module-federation/enhanced on npm](https://www.npmjs.com/package/@module-federation/enhanced)
- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)
