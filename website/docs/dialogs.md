---
title: Dialogs
slug: dialogs
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

### Intercepting the automatic close (backdrop click / escape)

By default, a dialog is closed when the user clicks next to the dialog or presses escape. Inside an iframe or module
dialog you can intercept this behavior by registering a close request listener via ```addCloseRequestListener```.
While at least one listener is registered, the dialog will not close automatically. Instead, all listeners are invoked
with an event and the dialog is responsible for closing itself (e.g. via ```setResult```).

```jsx
const { addCloseRequestListener, setResult } = useDialogState();

useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    // returns an unsubscribe function
    return addCloseRequestListener(async (event) => {
        // must be called synchronously (before any await) to prevent other listeners from being invoked
        event.stopPropagation();

        const { buttonType } = await createDialog({
            type: DialogType.CONFIRM,
            text: 'Discard your changes?',
        }).open();

        if (buttonType === DialogButtonType.OK) {
            void setResult(undefined);
        }
    });
}, [hasUnsavedChanges]);
```

Notes:

- ```event.reason``` is either ```'backdrop'``` or ```'esc'```.
- Listeners are invoked in reverse registration order (last registered first) until ```stopPropagation``` is called.
- As long as a listener is registered, closing the dialog is the responsibility of the listener. If no listener ever
  closes the dialog, the user can only close it through buttons or ```setResult```.

### Alert dialog with confetti animation and success Icon:

```jsx
import { createDialog, DialogType } from 'chayns-api';

const result = await createDialog({
    type: DialogType.ALERT,
    text: `[span style="text-align:center;display:block;"]${DialogIconType.SuccessIcon}[p]Danke für Deine Bestellung![/p][/span]`,
    animation: {
        type: DialogAnimation.CONFETTI
    }
}).open();
```
