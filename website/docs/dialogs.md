---
title: Dialog 
slug: dialog
---

The dialog functions provide you with the opportunity to interact with the user through modal windows that appear in
front of the page. They can be used to inform the user about a task and may contain important information, require
decisions, or involve multiple tasks.

The old dialogs can be found under the import ```dialog```, while the new ones are created through the function ```createDialoge```. 
Only the new IFrame dialogs support API V5. Unlike the old dialogs, it is possible to open another dialog from a dialog.

## Example dialogs:

### Alert dialog:

```jsx
import { createDialog, DialogType } from 'chayns-api';

const result = await createDialog({type: DialogType.ALERT, text: 'Hello World!'}).open();
```

### Input dialog

```jsx
import { createDialog, DialogType } from 'chayns-api';

const result = await createDialog({
    type: DialogType.INPUT,
    text: 'Hello World!',
    placeholder: 'Write something'
}).open();
```

### IFrame dialog

The functions ```addDataListener``` and ```dispatchEvent``` are only needed in exceptional cases, usually it is sufficient to pass data into the dialog via ```dialogInput```. The data can then be accessed in the dialog using the React hook ```useDialogData```.

```jsx
import { createDialog, DialogType, DialogButtonType } from 'chayns-api';

const dialog = await dialog = createDialog({
    type: DialogType.IFRAME,
    text: 'Hello world!',
    buttons: [{text: 'Ok', type: DialogButtonType.OK}],
    url: 'https://example.com/IFrameDialog.html',
    dialogInput: {test: Math.random()} // can be accessed in the dialog through useDialogData hook 
});

// receive data from dialog (optional)
dialog.addDataListener((data) => {
    console.log('received data from dialog', data);
})

// send data to iframe dialog (optional)
dialog.dispatchEvent({type: 'test', data: Math.random()});

const result = await dialog.open();
```

In the iframe dialog

```jsx
const { sendData, addDataListener, setResult, isClosingRequested } = useDialogState();
const dialogData = useDialogData();

useEffect(() => {
    if (isClosingRequested) {
        void setResult(Math.random());
    }
}, [isClosingRequested]);

useEffect(() => {
    // data send from iframe to dialog (optional)
    addDataListener((data) => {
        console.log('received data from host', data);
    });

    // send data back to host (optional)
    sendData({ type: 'test', data: { test: 1 } });
}, [])

```
