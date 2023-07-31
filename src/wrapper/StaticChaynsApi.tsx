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

    getSite = () => this._wrapper.values.site;
}

export default StaticChaynsApi;
