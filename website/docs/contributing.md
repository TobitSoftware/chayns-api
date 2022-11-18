---
title: Contributing
slug: contributing
---

First you should
[fork the project](https://github.com/tobitsoftware/chayns-api/fork) to your
own GitHub-Account to be able to commit changes to it.

Then clone the forked version to your computer. Install the packages by
executing

```bash
npm i
```

Link the package into the [example project](https://github.com/tobitsoftware/chayns-api-example) by running

```bash
# in chayns-api directory
npm watch 

# in chayns-api-example
npm i
npm link chayns-api
```

## Releasing a new version

If you have enough permissions on GitHub and NPM you can release a new version.

1. Use `npm version (patch|minor|major)` to increase the version.
2. Use `npm publish` to release the new version.

You do not have to build the project beforehand, that will be done pre-publish.
