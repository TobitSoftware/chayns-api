import React, { useContext, useEffect, useState } from 'react';
import { HydrationContext, type HydrationContextValueType } from '../constants';

type StoreLikeValue = object & { getState: () => object, abort?: () => Promise<void>, type?: 'raw' | 'json' };
type HydrationComponent = React.FC<{ value: StoreLikeValue, children?: React.ReactNode }>;
type Initializer = (initialValue: object | undefined, id: string) => StoreLikeValue;
type HydrationBoundary = React.FC<{ id?: string, children?: React.ReactNode }>;

const withHydrationBoundary = (Component: HydrationComponent, initializer: Initializer, useHydrationId: undefined | (() => string)): HydrationBoundary => {
    return ({ id: idProp, children }) => {
        let value: HydrationContextValueType;
        if (!globalThis.window) {
            value = useContext(HydrationContext);
        }
        const id = useHydrationId ? useHydrationId() : idProp;

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
            const s = initializer(initialValue, id);
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
            <Component value={store}>
                {children}
            </Component>
        );
    };
};

export default withHydrationBoundary;
