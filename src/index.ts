export { default as ChaynsProvider } from './components/ChaynsProvider';
export { default as getDeviceInfo, getScreenSize } from './util/deviceHelper';
export { default as ChaynsHost } from './host/ChaynsHost';
export { withCompatMode } from './components/withCompatMode';
export * from './calls';
export * from './hooks';
export * from './components/WaitUntil';
export * from './types/IChaynsReact';
export * from './components/withCompatMode';

export { default as DialogHandler } from './handler/DialogHandler';

export * as dialog from './calls/dialogs/index';

export * from './types/IChaynsReact';

export default {
    buildEnv: process.env.BUILD_ENV,
    appVersion: process.env.VERSION
}
