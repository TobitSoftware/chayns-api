export const firstMatchingPromise = async <T>(promises: Promise<T>[], earlyReturnCondition: (result: T) => boolean): Promise<T | undefined> => {
    const pending = promises.map((p, i) => p.then(v => ({ v, i })));
    let remaining = pending.length;

    while (remaining > 0 ) {
        const { v, i } = await Promise.race(pending);
        if (earlyReturnCondition(v)) {
            return v;
        }
        pending[i] = new Promise<never>(() => {}); // never resolves
        remaining--;
    }
    return undefined;
};
