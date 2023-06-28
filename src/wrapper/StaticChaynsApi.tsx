import { moduleWrapper } from '../components/moduleWrapper';
import { DataChangeCallback } from '../types/IChaynsReact';
import { FrameWrapper } from './FrameWrapper';


class StaticChaynsApi {
    ready: Promise<void>;
    addDataListener: (cb: DataChangeCallback) => () => void;

    constructor() {
        const wrapper = new FrameWrapper();
        moduleWrapper.current = wrapper;
        this.ready = wrapper.init();
        this.addDataListener = wrapper.addDataListener;
    }
}

export default StaticChaynsApi;
