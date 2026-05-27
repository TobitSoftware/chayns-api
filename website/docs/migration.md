# Migration Guide

This guide helps you migrate between major versions of chayns-api.

## Migrate v2 to v3

When updating to chayns-api@3, it is recommended to also update chayns-toolkit to version 4.

### Why is this update necessary?

Both chayns-api and chayns-toolkit have updated their `@module-federation/enhanced` dependency from version 0.x.x to 2.x.x. Updating both packages ensures a consistent module federation version across your project, preventing potential compatibility issues.

Please refer to the [chayns-toolkit migration guide](https://tobitsoftware.github.io/chayns-toolkit/docs/migrations/v3-to-v4) for detailed information on the toolkit upgrade.

## Migrate v1 to v2

When updating to chayns-api@2 you should also update chayns-toolkit to 3.0.1 or higher (check migration guide [here](https://tobitsoftware.github.io/chayns-toolkit/docs/migrations/v2-to-v3)).

### Why is this update necessary?

Version 2 migrated from the old webpack module federation plugin to `@module-federation/enhanced`. This is a significant architectural change that improves the module federation capabilities.

### Breaking Changes

Check urls referencing **remoteEntry.js**. The filename has been changed to **v2.remoteEntry.js**. This filename change allows detecting which module federation interface (old or new) is being used and ensures compatibility.

When your application uses ChaynsHost with module-type you might have to add a call of **initModuleFederationSharing** as early as possible in your application (e.g. index/bootstrap). Unless your application is already embedded as module somewhere else (e.g. in a dialog).

```javascript
initModuleFederationSharing({ name: 'project_name' });
```



