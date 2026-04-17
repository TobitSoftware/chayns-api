import { describe, expect, it, vi } from 'vitest';

/**
 * Mock rootHistory to break the circular dependency:
 *   history.ts → rootHistory.ts (constructor throws on absolute window.location.href)
 *
 * Mock calls so that importing history.ts doesn't require a live moduleWrapper.
 */
vi.mock('../../src/util/history/rootHistory', () => ({
    rootHistory: { back: vi.fn().mockResolvedValue(true) },
}));

vi.mock('../../src/calls', () => ({
    getSite: vi.fn(() => ({ url: 'http://localhost/' })),
    getDevice: vi.fn(() => ({})),
    invokeCall: vi.fn(),
}));

import { beforeUnloadCallback } from '../../src/util/history/history';

describe('beforeUnloadCallback', () => {
    it('sets event.returnValue to true', () => {
        const event = { stopPropagation: vi.fn() } as unknown as BeforeUnloadEvent;
        beforeUnloadCallback(event);
        expect((event as any).returnValue).toBe(true);
    });

    it('calls event.stopPropagation', () => {
        const event = { stopPropagation: vi.fn() } as unknown as BeforeUnloadEvent;
        beforeUnloadCallback(event);
        expect(event.stopPropagation).toHaveBeenCalledOnce();
    });
});
