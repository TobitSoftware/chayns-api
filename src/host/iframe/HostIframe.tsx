import React, { FC, useEffect, useRef } from 'react';
import * as comlink from 'comlink';
import postIframeForm from '../../util/postIframeForm';
import {
    ChaynsApiDevice,
    ChaynsApiSite,
    ChaynsApiUser,
    ChaynsReactFunctions,
    ChaynsReactValues,
    DataChangeCallback,
    DataChangeValue, IChaynsReact,
    Page,
} from '../../types/IChaynsReact';
import useUpdateData from './utils/useUpdateData';
import { replaceStagingUrl } from "../../util/url";

type HostIframeProps = {
    iFrameProps: { [key: string]: unknown, name: string },
    src: string,
    postForm?: boolean,
    iFrameRef: React.MutableRefObject<HTMLIFrameElement | null> | undefined,
    // shallow data
    pages: Page[],
    isAdminModeActive: boolean,
    site: ChaynsApiSite,
    user: ChaynsApiUser | undefined,
    currentPage: ChaynsReactValues["currentPage"],
    functions: ChaynsReactFunctions,
    customFunctions?: IChaynsReact["customFunctions"],
    device: ChaynsApiDevice,
    language: ChaynsReactValues["language"],
    parameters: ChaynsReactValues["parameters"],
    environment: ChaynsReactValues["environment"],
    customData: ChaynsReactValues["customData"],
    preventStagingReplacement?: boolean,
    dialog: ChaynsReactValues["dialog"]
}

const HostIframe: FC<HostIframeProps> = ({
    iFrameProps,
    src,
    postForm = false,
    iFrameRef,
    // shallow data
    pages,
    isAdminModeActive,
    site,
    user,
    currentPage,
    functions,
    customFunctions,
    device,
    language,
    parameters,
    environment,
    customData,
    preventStagingReplacement,
    dialog
}) => {
    const eventTarget = useRef<EventTarget>();
    const ref = useRef<HTMLIFrameElement | null>();
    const currentDataRef = useRef<ChaynsReactValues>();
    const customFunctionsRef = useRef<IChaynsReact["customFunctions"]>();
    customFunctionsRef.current = customFunctions;

    if (!eventTarget.current) {
        eventTarget.current = global.document ? document.createElement('div') : undefined; // global.EventTarget ? new EventTarget() : undefined
    }

    const setHeight = (value: number) => {
        if (ref.current) {
            ref.current.style.height = `${value}px`;
        }
    };

    // region initialData
    const initialData = {
        site,
        isAdminModeActive,
        pages,
        currentPage,
        device,
        user,
        language,
        parameters,
        environment,
        customData,
        dialog
    } as ChaynsReactValues;
    // endregion

    currentDataRef.current = initialData;

    // region postIframeForm
    useEffect(() => {
        (async() => {
            if (postForm) {
                const accessToken = (await functions.getAccessToken() ?? {});
                void postIframeForm(replaceStagingUrl(preventStagingReplacement, src, environment.buildEnvironment), JSON.stringify({ ...initialData, pages: undefined, ...accessToken }), 'chayns', iFrameProps.name)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // endregion

    // region expose data and functions to iframe
    useEffect(() => {
        if (ref.current?.contentWindow) {
            const obj = {
                [iFrameProps.name]: {
                    functions: {
                        ...functions,
                        setHeight,
                    } as ChaynsReactFunctions,
                    customFunctions: new Proxy(customFunctionsRef, {
                        get: (target, p: string) => target.current?.[p]
                    }),
                    _customFunctionNames: Object.keys(customFunctions ?? {}),
                    addDataListener: (cb: DataChangeCallback) => {
                        if(eventTarget.current) eventTarget.current.addEventListener('data_update', (e: CustomEventInit<DataChangeValue>) => e.detail && cb(e.detail));
                    },
                    getInitialData: () => currentDataRef.current,
                }
            };
            comlink.expose(obj, comlink.windowEndpoint(ref.current.contentWindow));
            ref.current.contentWindow.postMessage('chayns-api-host-ready', '*');
            // https://github.com/GoogleChromeLabs/comlink/pull/469 might be better approach once released
            return () => {
                delete obj[iFrameProps.name];
            }
        }
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // endregion

    // region dispatch data update
    useUpdateData(eventTarget.current, 'isAdminModeActive', isAdminModeActive);
    useUpdateData(eventTarget.current, 'user', user);
    useUpdateData(eventTarget.current, 'site', site);
    useUpdateData(eventTarget.current, 'pages', pages);
    useUpdateData(eventTarget.current, 'language', language);
    useUpdateData(eventTarget.current, 'parameters', parameters);
    useUpdateData(eventTarget.current, 'environment', environment);
    useUpdateData(eventTarget.current, 'customData', customData);
    useUpdateData(eventTarget.current, 'dialog', dialog);
    // endregion

    return (
        <iframe
            ref={(r) => {
                ref.current = r;
                if (iFrameRef) {
                    // eslint-disable-next-line no-param-reassign
                    iFrameRef.current = r;
                }
            }}
            title=" "
            {...iFrameProps}
            src={postForm ? undefined : replaceStagingUrl(preventStagingReplacement, src, environment.buildEnvironment)}
        />
    );
}

export default HostIframe;
