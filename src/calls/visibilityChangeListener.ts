import { VisibilityChangeListenerResult } from '../types/IChaynsReact';
import { addApiListener, dispatchApiEvent, removeApiListener } from '../helper/apiListenerHelper';

const key = 'visibilityChangeListener';

const handleVisibilityChange = () => {
    dispatchApiEvent(key, { isVisible: !document.hidden });
}

/**
 * @category Event listener
 */
export const addVisibilityChangeListener = (callback: (result: VisibilityChangeListenerResult) => void) => {
    const { id, shouldInitialize } = addApiListener(key, callback);

    if (shouldInitialize) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return id;
}
/**
 * @category Event listener
 */
export const removeVisibilityChangeListener = (id: number) => {
    const shouldRemove = removeApiListener(key, id);
    if (shouldRemove) {
        document.removeEventListener('addVisibilityChangeListener', handleVisibilityChange);
    }
}
