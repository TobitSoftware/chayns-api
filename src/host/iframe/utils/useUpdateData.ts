import { useEffect } from 'react';
import { ChaynsReactValues } from '../../../types/IChaynsReact';

const useUpdateData = <T extends keyof ChaynsReactValues>(target: EventTarget | undefined, type: T, value: ChaynsReactValues[T]) => {
    useEffect(() => {
        if(target) {
            target.dispatchEvent(new CustomEvent('data_update', {
                detail: {
                    type,
                    value,
                }
            }));
        }
    }, [target, type, value]);
}

export default useUpdateData;
