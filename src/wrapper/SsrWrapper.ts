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

    constructor(values: ChaynsReactValues, functions: ChaynsReactFunctions) {
        this.initialData = values;
        this.values = values;
        this.functions = functions;
    }

    async init() {
        return undefined;
    }

    addDataListener(cb: DataChangeCallback): CleanupCallback {
        const listener = (ev: CustomEventInit<DataChangeValue>) => ev.detail && cb(ev.detail);
        document.addEventListener('chayns_api_data', listener)
        return () => {document.removeEventListener('chayns_api_data', listener)}
    }

    getSSRData() {
        return this.initialData;
    }

    getInitialData() {
        return this.values;
    }
}
