type Listener<E> = (event: E) => void;

export class EventBus<E extends { type: string }> {
    private listeners = new Map<string, Set<Listener<E>>>();

    on(type: E['type'], handler: Listener<E>): () => void {
        let set = this.listeners.get(type);
        if (!set) {
            set = new Set();
            this.listeners.set(type, set);
        }
        set.add(handler);
        return () => set!.delete(handler);
    }

    emit(type: E['type'], event: E): void {
        const set = this.listeners.get(type);
        if (!set) return;
        for (const fn of [...set]) {
            try {
                fn(event);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[chaynsHistory] listener threw', err);
            }
        }
    }

    clear(): void {
        this.listeners.clear();
    }
}
