import React, { useEffect, useState } from 'react';
import ChaynsHost from "../host/ChaynsHost";
import { useFunctions, useValues } from "../hooks";

const AppDialogWrapper = ({ dialogEventTarget }) => {
    const functions = useFunctions();
    const data = useValues();

    const [dialogData, setDialogData] = useState(null);

    useEffect(() => {
        dialogEventTarget.addEventListener('change', (e) => {
            console.log(e.detail);
            setDialogData({dialogs: e.detail})
        })
    }, [])

    return (
        <ChaynsHost type={'client-module'} system={{module: './AppWrapper', url: 'https://w-mg-surface.tobit.ag:8080/remoteEntry.js', scope: 'dialog_v2'}} {...data} functions={functions} customData={dialogData ||{}} />
    )
}

export default AppDialogWrapper;
