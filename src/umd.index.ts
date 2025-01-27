import './util/transferNestedFunctions';

export { default as getDeviceInfo, getScreenSize, getClientDeviceInfo } from './util/deviceHelper';
export * from './calls';
export * from './types/IChaynsReact';
export * from './util/is';
export { default as StaticChaynsApi } from './wrapper/StaticChaynsApi';
export { default as DialogHandler } from './handler/DialogHandler';
export * as dialog from './calls/dialogs/index';
