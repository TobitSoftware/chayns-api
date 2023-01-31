import htmlEscape from 'htmlescape';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { AppName, ChaynsReactFunctions, ChaynsReactValues, IChaynsReact } from '../types/IChaynsReact';
import getDeviceInfo from '../util/deviceHelper';
import { AppWrapper } from '../wrapper/AppWrapper';
import { FrameWrapper } from '../wrapper/FrameWrapper';
import { ModuleFederationWrapper } from '../wrapper/ModuleFederationWrapper';
import { SsrWrapper } from '../wrapper/SsrWrapper';
import { ChaynsContext, ChaynsFunctionsContext } from './ChaynsContext';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const moduleWrapper: { current: IChaynsReact } = { current: undefined! }
const isServer = typeof window === 'undefined';

const InitialDataProvider = React.memo<{ data?: ChaynsReactValues, renderedByServer?: boolean }>(({ data, renderedByServer }) => {
    if (!renderedByServer) {
        return null;
    }
    return (
        <script id="__CHAYNS_DATA__" type="application/json" dangerouslySetInnerHTML={{ __html: htmlEscape(data || {}) }}/>
    );
}, () => true);

type ChaynsProviderProps = {
    data?: ChaynsReactValues;
    functions?: ChaynsReactFunctions,
    renderedByServer?: boolean,
    isModule?: boolean,
    children?: ReactNode,
}

const ChaynsProvider: React.FC<ChaynsProviderProps> = ({
    children,
    data,
    functions,
    renderedByServer,
    isModule
}) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const customWrapper = useRef<IChaynsReact>(null!);

    if (!customWrapper.current) {
        if (isModule) {
            if (data && functions) {
                customWrapper.current = new ModuleFederationWrapper(data, functions);
            } else {
                console.warn('ModuleFederationWrapper requires data and functions');
            }
        } else if (isServer) {
            if (data && functions) {
                customWrapper.current = new SsrWrapper(data, functions);
            } else {
                console.warn('SsrWrapper requires data and functions');
            }
        } else {
            const deviceInfo = getDeviceInfo(navigator.userAgent, '');
            // load framewrapper in Chaynsweb in app (window.self === window.top)
            if([AppName.Chayns, AppName.ChaynsLauncher].includes(deviceInfo.app?.name ?? AppName.Unknown) && window.self === window.top) {
                customWrapper.current = new AppWrapper();
            } else {
                customWrapper.current = new FrameWrapper();
            }
        }
        moduleWrapper.current = customWrapper.current;
    }

    const [state, setState] = useState<ChaynsReactValues | undefined>(customWrapper.current?.values ?? undefined);

    useEffect(() => {
        void (async () => {
            await customWrapper.current.init();
            customWrapper.current.addDataListener(({ type, value }) => {
                setState((oldState) => {
                    if(oldState) return ({ ...oldState, [type]: value })
                    return undefined;
                });
            });
            if (customWrapper.current.values) {
                setState({ ...customWrapper.current.values });
            }
        })();
    }, []);

    useEffect(() => {
        if (isModule) {
            setState(data);
            if (data) {
                moduleWrapper.current.values = data;
            }
        }
    }, [data, isModule]);

    return (
        <>
            {!!state && (
                <ChaynsContext.Provider value={state}>
                    <ChaynsFunctionsContext.Provider value={customWrapper.current?.functions}>
                        {children}
                    </ChaynsFunctionsContext.Provider>
                </ChaynsContext.Provider>
            )}
            <InitialDataProvider data={state} renderedByServer={renderedByServer}/>
        </>
    );
};

export default ChaynsProvider;
