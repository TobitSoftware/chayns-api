import {
    ChaynsReactFunctions,
    ChaynsReactValues,
    CleanupCallback,
    DataChangeCallback,
    DataChangeValue,
    IChaynsReact,
} from '../types/IChaynsReact';


export class SsrWrapper implements IChaynsReact {
    private readonly initialData: ChaynsReactValues;

    values: ChaynsReactValues;

    functions: ChaynsReactFunctions;

    customFunctions: IChaynsReact["customFunctions"];

    listeners: (() => void)[] =  [];

    constructor(values: ChaynsReactValues, functions: ChaynsReactFunctions, customFunctions?: IChaynsReact["customFunctions"]) {
        this.initialData = values;
        this.values = values;
        this.functions = functions;
        this.customFunctions = customFunctions ?? {};
    }

    async init() {
        return undefined;
    }

    addDataListener(cb: DataChangeCallback): CleanupCallback {
        const listener = (ev: CustomEventInit<DataChangeValue>) => ev.detail && cb(ev.detail);
        document.addEventListener('chayns_api_data', listener)
        return () => {document.removeEventListener('chayns_api_data', listener)}
    }

    subscribe = (listener: () => void) => {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        }
    }

    emitChange = () => {
        this.listeners.forEach((l) => l());
    }

    getSSRData() {
        return this.initialData;
    }

    getInitialData() {
        return this.values;
    }
}
