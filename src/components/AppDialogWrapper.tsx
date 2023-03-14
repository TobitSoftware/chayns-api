import React, { useEffect, useState } from 'react';
import ChaynsHost from '../host/ChaynsHost';
import { useFunctions, useValues } from '../hooks';
import { Dialog } from '../types/IChaynsReact';

const AppDialogWrapper = ({ dialogEventTarget }) => {
    const functions = useFunctions();
    const data = useValues();

    const [dialogData, setDialogData] = useState<{ dialogs: Dialog[] } | null>({ dialogs: [] });

    useEffect(() => {
        dialogEventTarget.addEventListener('change', (e) => {
            setDialogData({ dialogs: (e.detail as Dialog[]) });
        });
    }, []);

    return (
        <ChaynsHost
            type="client-module"
            system={{
                module: './AppWrapper',
                url: 'https://tapp-staging.chayns-static.space/api/dialog-v2/v1/remoteEntry.js',
                scope: 'dialog_v2',
            }}
            {...data}
            functions={functions}
            customData={dialogData}
        />
    );
};

export default AppDialogWrapper;
