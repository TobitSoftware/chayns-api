import React, { FC, useEffect, useRef } from 'react';
import * as comlink from 'comlink';
import postIframeForm from '../../utils/postIframeForm';
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
import { replaceStagingUrl } from "../../utils/url";
import { initTransferNestedFunctions } from '../../utils/transferNestedFunctions';
import type { ChaynsHistoryLayer } from '../../types/history';

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
    dialog: ChaynsReactValues["dialog"],
    styleSettings: ChaynsReactValues["styleSettings"],
    historyLayer?: ChaynsHistoryLayer,
    /** When true, enables the history layer. Defaults to false. */
    isHistoryEnabled?: boolean,
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
    dialog,
    styleSettings,
    historyLayer,
    isHistoryEnabled,
}) => {
    const eventTarget = useRef<EventTarget>();
    const ref = useRef<HTMLIFrameElement | null>();
    const currentDataRef = useRef<ChaynsReactValues>();
    const customFunctionsRef = useRef<IChaynsReact["customFunctions"]>();
    customFunctionsRef.current = customFunctions;
    const historyLayerRef = useRef<ChaynsHistoryLayer | undefined>(undefined);
    historyLayerRef.current = historyLayer;

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
        isHistoryEnabled,
        pages,
        currentPage,
        device,
        user,
        language,
        parameters,
        environment,
        customData,
        dialog,
        styleSettings,
    } as ChaynsReactValues;
    // endregion

    currentDataRef.current = initialData;

    // region postIframeForm
    useEffect(() => {
        (async () => {
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
            initTransferNestedFunctions();

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
                        if (eventTarget.current) eventTarget.current.addEventListener('data_update', (e: CustomEventInit<DataChangeValue>) => e.detail && cb(e.detail));
                    },
                    getInitialData: () => currentDataRef.current,
                    history: {
                        getInitialState: () => {
                            const l = historyLayerRef.current;
                            if (!l) return null;
                            return {
                                id: l.id,
                                depth: l.depth,
                                segments: l.getRoute(),
                                params: l.getParams(),
                                hash: l.getHash(),
                                state: l.getState(),
                                activeChildId: l.getActiveChildId(),
                                segmentCount: l.getSegmentCount(),
                            };
                        },
                        setRoute: async (route: string | string[], opts?: unknown) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] setRoute is not allowed on this page');
                            }
                            await historyLayerRef.current.setRoute(route, opts as never);
                        },
                        setParams: async (params: Record<string, string>, opts?: unknown) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] setParams is not allowed on this page');
                            }
                            await historyLayerRef.current.setParams(params, opts as never);
                        },
                        setHash: async (hash: string, opts?: unknown) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] setHash is not allowed on this page');
                            }
                            await historyLayerRef.current.setHash(hash, opts as never);
                        },
                        setState: async (state: Record<string, unknown>, opts?: unknown) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] setState is not allowed on this page');
                            }
                            await historyLayerRef.current.setState(state, opts as never);
                        },
                        navigate: (opts: unknown) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] navigate is not allowed on this page');
                            }
                            return historyLayerRef.current.navigate(opts as never);
                        },
                        setActiveChild: (id: string | null, init?: unknown) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] setActiveChild is not allowed on this page');
                            }
                            return historyLayerRef.current.setActiveChild(id, init as never);
                        },
                        setSegmentCount: async (n: number) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] setSegmentCount is not allowed on this page');
                            }
                            await historyLayerRef.current.setSegmentCount(n);
                        },
                        addChangeListener: (callback: (e: unknown) => void) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] addChangeListener is not allowed on this page');
                            }

                            const unsub = historyLayerRef.current?.addEventListener('change', callback as never) ?? (() => {
                            });
                            return comlink.proxy(unsub);
                        },
                        addPopstateListener: (callback: (e: unknown) => void) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] addPopstateListener is not allowed on this page');
                            }

                            const unsub = historyLayerRef.current?.addEventListener('popstate', callback as never) ?? (() => {
                            });
                            return comlink.proxy(unsub);
                        },
                        addBlock: (callback: () => Promise<boolean>, opts?: unknown) => {
                            if (!historyLayerRef.current) {
                                throw new Error('[chayns-api] addBlock is not allowed on this page');
                            }

                            const unsub = historyLayerRef.current?.addBlock(callback, opts as never) ?? (() => {
                            });
                            return comlink.proxy(unsub);
                        },
                    }
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
    useUpdateData(eventTarget.current, 'isHistoryEnabled', isHistoryEnabled);
    useUpdateData(eventTarget.current, 'isAdminModeActive', isAdminModeActive);
    useUpdateData(eventTarget.current, 'user', user);
    useUpdateData(eventTarget.current, 'site', site);
    useUpdateData(eventTarget.current, 'pages', pages);
    useUpdateData(eventTarget.current, 'language', language);
    useUpdateData(eventTarget.current, 'parameters', parameters);
    useUpdateData(eventTarget.current, 'environment', environment);
    useUpdateData(eventTarget.current, 'currentPage', currentPage);
    useUpdateData(eventTarget.current, 'customData', customData);
    useUpdateData(eventTarget.current, 'dialog', dialog);
    useUpdateData(eventTarget.current, 'styleSettings', styleSettings);
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
