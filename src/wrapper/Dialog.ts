
export default class Dialog {
    private dialogId;
    private isOpen = false;
    private readonly _open;
    private readonly _close;
    private readonly _config;

    constructor(config, open, close) {
        this._open = open;
        this._close = close;
        this._config = config;
    }

    async open() {
        if (this.isOpen) {
            throw new Error('cannot open a dialog which is already open');
        }
        return new Promise(async (resolve) => {
            const callback = (data) => {
                this.isOpen = false;
                resolve(data);
            };
            this.isOpen = true;
            this.dialogId = await this._open(this._config, callback);
        });
    }

    close(buttonType, data) {
        if (!this.isOpen) {
            return;
        }
        this.isOpen = false;
        this._close(this.dialogId, data);
    }
}
