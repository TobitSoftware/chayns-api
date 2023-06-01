/* eslint-disable */
// @ts-nocheck

import semver from 'semver';
import React from 'react';
import { semaphore } from './useDynamicScript';

let instances = {};

export default function loadComponent(scope, module, url, skipCompatMode = false, preventSingleton = false) {
    return async () => {
        // Initializes the shared scope. Fills it with known provided modules from this build and all remotes
        await __webpack_init_sharing__('default');
        const { container } = window[scope + "_list"].find(x => x.url === url); // or get the container somewhere else
        // Initialize the container, it may provide shared modules
        const shareScopes = { ...__webpack_share_scopes__.default };
        shareScopes.react = Object.entries(shareScopes.react).filter(([k]) => k === React.version).reduce((p, [k, v]) => {
            p[k] = v;
            return p;
        }, {});

        await container.init(shareScopes);
        const factory = await container.get(module);
        semaphore[scope!].release();

        let ModuleMap = instances[`${scope}__${module}`];
        let Module;
        if (!ModuleMap) {
            ModuleMap = {};
            instances[`${scope}__${module}`] = ModuleMap;
        }
        if (Object.keys(ModuleMap).length > 0) {
            const newModule = factory();
            Module = ModuleMap[`${newModule.default.buildEnv}__${newModule.default.appVersion}`];
            if (!Module) {
                Module = newModule;
                ModuleMap[`${newModule.default.buildEnv}__${newModule.default.appVersion}`] = newModule;
            }
        } else {
            Module = factory();
            ModuleMap[`${Module.default.buildEnv}__${Module.default.appVersion}`] = Module;
        }

        if(preventSingleton) {
            // Intercom :)
            window[scope + "_list"] = null;
        }

        if(skipCompatMode) return Module;
        const hostVersion = semver.minVersion(React.version);
        const { requiredVersion, environment } = Module.default;
        const matchReactVersion = requiredVersion && semver.satisfies(hostVersion, requiredVersion);

        if (!matchReactVersion || environment !== 'production') {
            return { default: Module.default.CompatComponent };
        }
        return { default: Module.default.Component };
    };
}
