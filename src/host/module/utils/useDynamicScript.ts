import React, { useEffect } from 'react';
import Semaphore from 'semaphore-async-await';

export const semaphore = {};

const useDynamicScript = (args: { url: string | undefined, scope: string | undefined }) => {
    const [ready, setReady] = React.useState(false);
    const [failed, setFailed] = React.useState(false);

    useEffect(() => {
        if (!args.url) {
            return undefined;
        }

        const element = document.createElement('script');

        element.src = args.url;
        element.type = 'text/javascript';
        element.async = true;

        setReady(false);
        setFailed(false);

        if(!(args.scope! in semaphore)) {
            semaphore[args.scope!] = new Semaphore(1)
        }

        (async () => {
            await semaphore[args.scope!].acquire();
            element.onload = () => {
                setReady(true);
                const listKey = args.scope + "_list";
                if(!window[listKey]) window[listKey] = [];
                window[listKey].push({
                    url: args.url,
                    container: window[args.scope!]
                });
                window[args.scope!] = null;
            };

            element.onerror = () => {
                setReady(false);
                setFailed(true);
            };

            document.head.appendChild(element);
        })();

        return () => {
            semaphore[args.scope!].release();
            if(document.head.contains(element)) {
                document.head.removeChild(element);
            }
        };
    }, [args.url]);

    return {
        ready,
        failed,
    };
};

export default useDynamicScript;
