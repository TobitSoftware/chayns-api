import { moduleWrapper } from '../components/moduleWrapper';
import { DataChangeCallback } from '../types/IChaynsReact';
import { FrameWrapper } from './FrameWrapper';


class StaticChaynsApi {
    ready: Promise<void>;
    addDataListener: (cb: DataChangeCallback) => () => void;

    private _wrapper;

    constructor() {
        const wrapper = new FrameWrapper();
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
}

export default StaticChaynsApi;
