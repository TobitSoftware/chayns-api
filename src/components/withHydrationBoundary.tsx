import React, { useContext, useEffect, useState } from 'react';
import { HydrationContext, type HydrationContextValueType } from '../constants';

type StoreLikeValue = object & { getState: () => object, abort?: () => Promise<void> };
type HydrationComponent = React.FC<{ value: StoreLikeValue, children?: React.ReactNode }>;
type Initializer = (initialValue: object | undefined) => StoreLikeValue;
type HydrationBoundary = React.FC<{ id: string, children?: React.ReactNode }>;

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
            let initialValue = undefined;
            if (globalThis.window) {
                const htmlId = `__INITIAL_DATA_${id}__`;
                const $elem = document.getElementById(htmlId);
                if ($elem) {
                    initialValue = JSON.parse($elem.innerHTML);
                }
            }
            const s = initializer(initialValue);
            if (!globalThis.window) {
                if (id in value) {
                    console.warn(`Dehydration function for id "${id}" has been defined multiple times. This can have two reasons. The children cause suspension and therefor the hydration boundary has to mount from scratch again. You can avoid this by adding a Suspense around the children. The id is not unique. This has to be fixed or might cause hydration issues.`);
                }
                value[id] = { getState: s.getState, abort: s.abort };
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
