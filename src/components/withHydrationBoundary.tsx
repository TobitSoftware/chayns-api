import React, { useContext, useEffect, useState } from 'react';
import { HydrationContext, type HydrationContextValueType } from '../constants';

type StoreLikeValue = object & { getState: () => object, abort?: () => Promise<void>, type?: 'raw' | 'json' };
type HydrationComponent = React.FC<{ value: StoreLikeValue, children?: React.ReactNode }>;
type Initializer = (initialValue: object | undefined) => StoreLikeValue;
type HydrationBoundary = React.FC<{ id?: string, children?: React.ReactNode }>;

const withHydrationBoundary = (Component: HydrationComponent, initializer: Initializer, useHydrationId: undefined | (() => string)): HydrationBoundary => {
    return ({ id: idProp, children }) => {
        const value = useContext(HydrationContext);
        const id = useHydrationId ? useHydrationId() : idProp;

        if (!id) {
            throw new Error('hydration boundary was not given a id which is required');
        }

        const [store] = useState(() => {
            if (id in value) {
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
            return value[id] = initializer(initialValue);
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
