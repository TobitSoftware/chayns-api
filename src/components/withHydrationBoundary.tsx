import React, { useContext, useEffect, useState } from 'react';
import { HydrationContext, type HydrationContextValueType } from '../constants';

export interface StoreLikeValue<T> {
    getState: () => T;
    abort?: () => Promise<void>;
    type?: 'raw' | 'json';
}

type HydrationComponent<T, S, U> = React.FC<T & { value: U & StoreLikeValue<S>, children?: React.ReactNode }>;
type Initializer<T, S, U> = (initialValue: S | undefined, id: string, props: T) => U & StoreLikeValue<S>;
type HydrationBoundary<T> = React.FC<T & { id?: string, children?: React.ReactNode }>;

function withHydrationBoundary<P extends object, T, S>(
    Component: HydrationComponent<P, T, S>,
    initializer: Initializer<undefined, T, S>,
): HydrationBoundary<P & { id: string }>;

function withHydrationBoundary<P extends object, T, S>(
    Component: HydrationComponent<P, T, S>,
    initializer: Initializer<undefined, T, S>,
    useHydrationId: () => string,
): HydrationBoundary<P>;

function withHydrationBoundary<P extends object, T, S, U>(
    Component: HydrationComponent<P, T, S>,
    initializer: Initializer<U, T, S>,
    useHydrationId: undefined,
    useProps: (props: P) => U,
): HydrationBoundary<P & { id: string }>;

function withHydrationBoundary<P extends object, T, S, U>(
    Component: HydrationComponent<P, T, S>,
    initializer: Initializer<U, T, S>,
    useHydrationId: (() => string),
    useProps: (props: P) => U,
): HydrationBoundary<P>;

function withHydrationBoundary<P extends object, T, S, U>(
    Component: HydrationComponent<P, T, S>,
    initializer: Initializer<U, T, S>,
    useHydrationId?: () => string,
    useProps?: (props: P) => U,
): HydrationBoundary<P> {
    return ({ id: idProp, children, ...rest }) => {
        let value: HydrationContextValueType<T>;
        if (!globalThis.window) {
            value = useContext(HydrationContext) as HydrationContextValueType<T>;
        }
        const id = useHydrationId ? useHydrationId() : idProp;
        const props = useProps ? useProps(rest as P) : undefined;

        if (!id) {
            throw new Error('hydration boundary was not given a id which is required');
        }

        const [store] = useState(() => {
            if (!globalThis.window && (id in value)) {
                return value[id] as S & StoreLikeValue<T>;
            }
            let initialValue = undefined;
            if (globalThis.window) {
                const htmlId = `__INITIAL_DATA_${id}__`;
                const $elem = document.getElementById(htmlId);
                if ($elem) {
                    initialValue = JSON.parse($elem.innerHTML);
                }
            }
            const s = initializer(initialValue, id, props!);
            if (!globalThis.window) {
                value[id] = s;
            }
            return s;
        });

        useEffect(() => {
            const htmlId = `__INITIAL_DATA_${id}__`;
            const $elem = document.getElementById(htmlId);
            if ($elem) {
                $elem.remove();
            }
        }, []);

        return (
            <Component {...rest as P} value={store}>
                {children}
            </Component>
        );
    };
}

export default withHydrationBoundary;
