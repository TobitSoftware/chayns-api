export default class DialogHandler<S = void, T extends any = void> {
    private dialogId;
    private isOpen = false;
    private result: { buttonType: number; result: T extends undefined ? S : T } | undefined;
    private readonly _open;
    private readonly _close;
    private readonly _config;
    private readonly _dispatchEvent;
    private readonly _addDataListener;
    private readonly listeners: ((data: object) => void)[] = [];

    constructor(config, open, close, dispatchEvent, addDataListener) {
        this._open = open;
        this._close = close;
        this._config = config;
        this._dispatchEvent = dispatchEvent;
        this._addDataListener = addDataListener;
    }

    async open() {
        if (this.isOpen) {
            throw new Error('cannot open a dialog which is already open');
        }
        const res = await new Promise<{ buttonType: number, result: T extends undefined ? S : T }>(async (resolve) => {
            const callback = (data) => {
                this.isOpen = false;
                resolve(data);
            };
            this.isOpen = true;
            this.dialogId = await this._open(this._config, callback);

            // console.log('dialogId', this.dialogId);

            this._addDataListener(this.dialogId, (data) => {
                // console.log('[DialogHandler]dataListener', this.dialogId, data);
                this.listeners.forEach((cb) => cb(data));
            });
        });
        return this.result = res;
    }

    close(buttonType, data) {
        if (!this.isOpen) {
            return;
        }
        this.isOpen = false;
        this._close(this.dialogId, data);
    }

    dispatchEvent(data: object) {
        if (!this.isOpen) {
            return;
        }
        this._dispatchEvent(this.dialogId, data);
    }

    addDataListener(listener: (data: any) => void) {
        this.listeners.push(listener);
    }

    removeDataListener(listener: (data: any) => void) {
        const index = this.listeners.findIndex((l) => l === listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    getResult() {
        return this.result;
    }
}
