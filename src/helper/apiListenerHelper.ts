const listenerMapping: Record<string, Record<number, (result: unknown) => unknown | void>> = {};
let counter = 0;

export const addApiListener = (key: string, callback: (result: any) => unknown | void) => {
    const id = ++counter;
    if (!listenerMapping[key]) {
        listenerMapping[key] = {};
    }
    const shouldInitialize = Object.keys(listenerMapping[key]).length === 0;

    listenerMapping[key][counter] = callback;

    return { id, shouldInitialize };
}

export const removeApiListener = (key: string, id: number) => {
    if (listenerMapping[key]) {
        delete listenerMapping[key][id];
    }
    return Object.keys(listenerMapping[key]).length === 0;
}

export const dispatchApiEvent = (key: string, value: unknown) => {
    if (listenerMapping[key]) {
        Object.values(listenerMapping[key]).forEach((l) => l(value));
    }
}
