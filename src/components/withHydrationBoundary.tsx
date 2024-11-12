import React, { useContext, useEffect, useState } from 'react';
import { HydrationContext, type HydrationContextValueType } from '../constants';

type StoreLikeValue = object & { getState: () => object, abort?: () => Promise<void>, type?: 'raw' | 'json' };
type HydrationComponent<T> = React.FC<T & { value: StoreLikeValue, children?: React.ReactNode }>;
type Initializer<T> = (initialValue: object | undefined, id: string, props: T) => StoreLikeValue;
type HydrationBoundary<T> = React.FC<T & { id?: string, children?: React.ReactNode }>;

function withHydrationBoundary<P extends object>(
    Component: HydrationComponent<P>,
    initializer: Initializer<undefined>,
    useHydrationId?: () => string,
): HydrationBoundary<P>;

function withHydrationBoundary<P extends object, T>(
    Component: HydrationComponent<P>,
    initializer: Initializer<T>,
    useHydrationId: undefined | (() => string),
    useProps: (props: P) => T,
): HydrationBoundary<P>;

function withHydrationBoundary<P extends object, T>(
    Component: HydrationComponent<P>,
    initializer: Initializer<T>,
    useHydrationId?: () => string,
    useProps?: (props: P) => T,
): HydrationBoundary<P> {
    return ({ id: idProp, children, ...rest }) => {
        let value: HydrationContextValueType;
        if (!globalThis.window) {
            value = useContext(HydrationContext);
        }
        const id = useHydrationId ? useHydrationId() : idProp;
        const props = useProps ? useProps(rest as P) : undefined;

        if (!id) {
            throw new Error('hydration boundary was not given a id which is required');
        }

        const [store] = useState(() => {
            if (!globalThis.window && (id in value)) {
                return value[id];
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
