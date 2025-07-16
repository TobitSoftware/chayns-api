import DialogHandler from '../handler/DialogHandler';
import {
    ChaynsReactFunctions,
    ChaynsReactValues,
    DataChangeCallback,
    DataChangeValue, Dialog,
    IChaynsReact,
    IntercomMessage,
} from '../types/IChaynsReact';
import { addVisibilityChangeListener, removeVisibilityChangeListener } from '../calls/visibilityChangeListener';
import getUserInfo from '../calls/getUserInfo';
import { sendMessageToGroup, sendMessageToPage, sendMessageToUser } from '../calls/sendMessage';

export class ModuleFederationWrapper implements IChaynsReact {
    values: ChaynsReactValues;

    functions: ChaynsReactFunctions;

    customFunctions: IChaynsReact["customFunctions"] = {};

    listeners: (() => void)[] =  [];

    constructor(values: ChaynsReactValues, functions: ChaynsReactFunctions, customFunctions?: IChaynsReact["customFunctions"]) {
        this.values = values;
        this.functions = {} as ChaynsReactFunctions;
        this.functions.addVisibilityChangeListener = async (callback) => addVisibilityChangeListener(callback);
        this.functions.removeVisibilityChangeListener = async (id) => removeVisibilityChangeListener(id);
        this.functions.getUserInfo = async (query) => getUserInfo(this, query);
        this.functions.sendMessageToGroup = async (groupId: number, object: IntercomMessage) =>
            sendMessageToGroup(this, object, groupId);
        this.functions.sendMessageToPage = async (object: IntercomMessage) =>
            sendMessageToPage(this, object);
        this.functions.sendMessageToUser = async (userId: number, object: IntercomMessage) =>
            sendMessageToUser(this, object, userId);
        // make all functions async to be consistent with frame wrapper
        Object.entries(functions).forEach(([k, fn]) => {
            // eslint-disable-next-line
            this.functions[k] = async (...args) => (fn as Function)(...args);
        });

        if (customFunctions) {
            this.customFunctions = customFunctions;
        }

        this.functions.createDialog = <I, R>(config: Dialog<I>) => {
            return new DialogHandler<R>(config, functions.openDialog, functions.closeDialog, functions.dispatchEventToDialogClient, functions.addDialogClientEventListener);
        }
    }

    async init() {
        return undefined;
    }

    addDataListener(cb: DataChangeCallback) {
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
        return null;
    }

    getInitialData() {
        return this.values;
    }
}
