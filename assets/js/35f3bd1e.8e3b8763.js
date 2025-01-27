"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[918],{4822:(e,a,t)=>{t.r(a),t.d(a,{assets:()=>d,contentTitle:()=>l,default:()=>g,frontMatter:()=>s,metadata:()=>n,toc:()=>r});const n=JSON.parse('{"id":"dialogs","title":"Dialogs","description":"The dialog functions provide you with the opportunity to interact with the user through modal windows that appear in","source":"@site/docs/dialogs.md","sourceDirName":".","slug":"/dialogs","permalink":"/chayns-api/docs/dialogs","draft":false,"unlisted":false,"editUrl":"https://github.com/TobitSoftware/chayns-api/edit/main/docs/docs/dialogs.md","tags":[],"version":"current","frontMatter":{"title":"Dialogs","slug":"dialogs"},"sidebar":"docs","previous":{"title":"Getting Started","permalink":"/chayns-api/docs/"},"next":{"title":"Contributing","permalink":"/chayns-api/docs/contributing"}}');var o=t(4848),i=t(8453);const s={title:"Dialogs",slug:"dialogs"},l=void 0,d={},r=[{value:"Example dialogs:",id:"example-dialogs",level:2},{value:"Alert dialog:",id:"alert-dialog",level:3},{value:"Input dialog",id:"input-dialog",level:3},{value:"IFrame dialog",id:"iframe-dialog",level:3},{value:"Alert dialog with confetti animation and success Icon:",id:"alert-dialog-with-confetti-animation-and-success-icon",level:3}];function c(e){const a={code:"code",h2:"h2",h3:"h3",p:"p",pre:"pre",...(0,i.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(a.p,{children:"The dialog functions provide you with the opportunity to interact with the user through modal windows that appear in\nfront of the page. They can be used to inform the user about a task and may contain important information, require\ndecisions, or involve multiple tasks."}),"\n",(0,o.jsxs)(a.p,{children:["The old dialogs can be found under the import ",(0,o.jsx)(a.code,{children:"dialog"}),", while the new ones are created through the function ",(0,o.jsx)(a.code,{children:"createDialoge"}),".\nOnly the new IFrame dialogs support API V5. Unlike the old dialogs, it is possible to open another dialog from a dialog."]}),"\n",(0,o.jsx)(a.h2,{id:"example-dialogs",children:"Example dialogs:"}),"\n",(0,o.jsx)(a.h3,{id:"alert-dialog",children:"Alert dialog:"}),"\n",(0,o.jsx)(a.pre,{children:(0,o.jsx)(a.code,{className:"language-jsx",children:"import { createDialog, DialogType } from 'chayns-api';\n\nconst result = await createDialog({type: DialogType.ALERT, text: 'Hello World!'}).open();\n"})}),"\n",(0,o.jsx)(a.h3,{id:"input-dialog",children:"Input dialog"}),"\n",(0,o.jsx)(a.pre,{children:(0,o.jsx)(a.code,{className:"language-jsx",children:"import { createDialog, DialogType } from 'chayns-api';\n\nconst result = await createDialog({\n    type: DialogType.INPUT,\n    text: 'Hello World!',\n    placeholder: 'Write something'\n}).open();\n"})}),"\n",(0,o.jsx)(a.h3,{id:"iframe-dialog",children:"IFrame dialog"}),"\n",(0,o.jsxs)(a.p,{children:["The functions ",(0,o.jsx)(a.code,{children:"addDataListener"})," and ",(0,o.jsx)(a.code,{children:"dispatchEvent"})," are only needed in exceptional cases, usually it is sufficient to pass data into the dialog via ",(0,o.jsx)(a.code,{children:"dialogInput"}),". The data can then be accessed in the dialog using the React hook ",(0,o.jsx)(a.code,{children:"useDialogData"}),"."]}),"\n",(0,o.jsx)(a.pre,{children:(0,o.jsx)(a.code,{className:"language-jsx",children:"import { createDialog, DialogType, DialogButtonType } from 'chayns-api';\n\nconst dialog = await dialog = createDialog({\n    type: DialogType.IFRAME,\n    text: 'Hello world!',\n    buttons: [{text: 'Ok', type: DialogButtonType.OK}],\n    url: 'https://example.com/IFrameDialog.html',\n    dialogInput: {test: Math.random()} // can be accessed in the dialog through useDialogData hook \n});\n\n// receive data from dialog (optional)\ndialog.addDataListener((data) => {\n    console.log('received data from dialog', data);\n})\n\n// send data to iframe dialog (optional)\ndialog.dispatchEvent({type: 'test', data: Math.random()});\n\nconst result = await dialog.open();\n"})}),"\n",(0,o.jsx)(a.p,{children:"In the iframe dialog"}),"\n",(0,o.jsx)(a.pre,{children:(0,o.jsx)(a.code,{className:"language-jsx",children:"const { sendData, addDataListener, setResult, isClosingRequested } = useDialogState();\nconst dialogData = useDialogData();\n\nuseEffect(() => {\n    if (isClosingRequested) {\n        void setResult(Math.random());\n    }\n}, [isClosingRequested]);\n\nuseEffect(() => {\n    // data send from iframe to dialog (optional)\n    addDataListener((data) => {\n        console.log('received data from host', data);\n    });\n\n    // send data back to host (optional)\n    sendData({ type: 'test', data: { test: 1 } });\n}, [])\n\n"})}),"\n",(0,o.jsx)(a.h3,{id:"alert-dialog-with-confetti-animation-and-success-icon",children:"Alert dialog with confetti animation and success Icon:"}),"\n",(0,o.jsx)(a.pre,{children:(0,o.jsx)(a.code,{className:"language-jsx",children:"import { createDialog, DialogType } from 'chayns-api';\n\nconst result = await createDialog({\n    type: DialogType.ALERT,\n    text: `[span style=\"text-align:center;display:block;\"]${DialogIconType.SuccessIcon}[p]Danke f\xfcr Deine Bestellung![/p][/span]`,\n    animation: {\n        type: DialogAnimation.CONFETTI\n    }\n}).open();\n"})})]})}function g(e={}){const{wrapper:a}={...(0,i.R)(),...e.components};return a?(0,o.jsx)(a,{...e,children:(0,o.jsx)(c,{...e})}):c(e)}},8453:(e,a,t)=>{t.d(a,{R:()=>s,x:()=>l});var n=t(6540);const o={},i=n.createContext(o);function s(e){const a=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(a):{...a,...e}}),[a,e])}function l(e){let a;return a=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:s(e.components),n.createElement(i.Provider,{value:a},e.children)}}}]);