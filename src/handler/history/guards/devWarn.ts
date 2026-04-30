export function devWarn(code: string, message: string, data?: unknown): void {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.warn(`[chaynsHistory:${code}] ${message}`, data ?? '');
}
