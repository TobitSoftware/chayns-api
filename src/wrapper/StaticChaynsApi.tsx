import { moduleWrapper } from '../components/moduleWrapper';
import { AppFlavor, AppName, DataChangeCallback, IChaynsReact } from '../types/IChaynsReact';
import getDeviceInfo from '../util/deviceHelper';
import { AppWrapper } from './AppWrapper';
import { FrameWrapper } from './FrameWrapper';
import {ModuleFederationWrapper} from "./ModuleFederationWrapper";


class StaticChaynsApi {
    ready: Promise<void>;
    addDataListener: (cb: DataChangeCallback) => () => void;

    private _wrapper: IChaynsReact;

    constructor(values, functions) {
        let wrapper;
        const deviceInfo = getDeviceInfo(navigator.userAgent, '');
        if(values && functions) {
            wrapper = new ModuleFederationWrapper(values, functions);
        } else if(deviceInfo.app?.flavor === AppFlavor.Chayns && window.self === window.top) {
            wrapper = new AppWrapper();
        } else {
            wrapper = new FrameWrapper();
        }
        moduleWrapper.current = wrapper;
        this._wrapper = wrapper;
        this.ready = wrapper.init();
        this.addDataListener = wrapper.addDataListener;

        Object.entries(wrapper.functions).forEach(([k,v]) => {
            this[k] = v;
        });
    }

    getUser = () => this._wrapper.values.user;
    getSite = () => this._wrapper.values.site;
    getCurrentPage = () => this._wrapper.values.currentPage;
    getDevice = () => this._wrapper.values.device;
    getLanguage = () => this._wrapper.values.language;
    getParameters = () => this._wrapper.values.parameters;
    getPages = () => this._wrapper.values.pages;
    getEnvironment = () => this._wrapper.values.environment;
    getStyleSettings = () => this._wrapper.values.styleSettings;
    getCustomFunction = (key: string) => this._wrapper.customFunctions[key];
}

export default StaticChaynsApi;
