export function hasWindow(): boolean {
    return typeof window !== 'undefined' && typeof window.history !== 'undefined';
}
