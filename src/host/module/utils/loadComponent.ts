/* eslint-disable */
// @ts-nocheck

import semver from 'semver';
import React from 'react';
import { semaphore } from './useDynamicScript';

let instances = {};

export default function loadComponent(scope, module, url, skipCompatMode = false) {
    return async () => {
        // Initializes the shared scope. Fills it with known provided modules from this build and all remotes
        // eslint-disable-next-line no-undef
        await __webpack_init_sharing__('default');
        const { container } = window[scope + "_list"].find(x => x.url === url); // or get the container somewhere else
        // Initialize the container, it may provide shared modules
        // eslint-disable-next-line no-undef
        await container.init(__webpack_share_scopes__.default);
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
