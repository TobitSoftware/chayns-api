import './util/transferNestedFunctions';

export { default as ChaynsProvider } from './components/ChaynsProvider';
export { default as getDeviceInfo, getScreenSize, getClientDeviceInfo } from './util/deviceHelper';
export { default as ChaynsHost } from './host/ChaynsHost';
export { withCompatMode } from './components/withCompatMode';
export * from './calls';
export * from './hooks';
export * from './components/WaitUntil';
export * from './types/IChaynsReact';
export * from './util/is';
export * from './components/withCompatMode';
export * from './constants';
export { default as withHydrationBoundary } from './components/withHydrationBoundary';
export { default as StaticChaynsApi } from './wrapper/StaticChaynsApi';

export { default as loadComponent, loadModule } from './host/module/utils/loadComponent';

export { default as DialogHandler } from './handler/DialogHandler';

export * as dialog from './calls/dialogs/index';

export * from './types/IChaynsReact';

export default {
    buildEnv: process.env.BUILD_ENV,
    appVersion: process.env.VERSION
}
