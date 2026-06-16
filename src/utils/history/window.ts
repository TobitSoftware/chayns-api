export function hasWindowHistory(): boolean {
    return typeof window !== 'undefined' && typeof window.history !== 'undefined';
}
