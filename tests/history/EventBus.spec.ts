import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/utils/EventBus';

type TestEvent = { type: 'foo' | 'bar'; value: number };

describe('EventBus', () => {
    it('calls registered listener when event is emitted', () => {
        const bus = new EventBus<TestEvent>();
        const handler = vi.fn();
        bus.on('foo', handler);
        bus.emit('foo', { type: 'foo', value: 42 });
        expect(handler).toHaveBeenCalledOnce();
        expect(handler).toHaveBeenCalledWith({ type: 'foo', value: 42 });
    });

    it('does not call listener registered for a different type', () => {
        const bus = new EventBus<TestEvent>();
        const handler = vi.fn();
        bus.on('bar', handler);
        bus.emit('foo', { type: 'foo', value: 1 });
        expect(handler).not.toHaveBeenCalled();
    });

    it('calls multiple listeners for the same type', () => {
        const bus = new EventBus<TestEvent>();
        const h1 = vi.fn();
        const h2 = vi.fn();
        bus.on('foo', h1);
        bus.on('foo', h2);
        bus.emit('foo', { type: 'foo', value: 1 });
        expect(h1).toHaveBeenCalledOnce();
        expect(h2).toHaveBeenCalledOnce();
    });

    it('on() returns an unsubscribe function that removes the listener', () => {
        const bus = new EventBus<TestEvent>();
        const handler = vi.fn();
        const off = bus.on('foo', handler);
        off();
        bus.emit('foo', { type: 'foo', value: 1 });
        expect(handler).not.toHaveBeenCalled();
    });

    it('unsubscribed listener is not called on subsequent emits', () => {
        const bus = new EventBus<TestEvent>();
        const handler = vi.fn();
        const off = bus.on('foo', handler);
        bus.emit('foo', { type: 'foo', value: 1 });
        off();
        bus.emit('foo', { type: 'foo', value: 2 });
        expect(handler).toHaveBeenCalledOnce();
    });

    it('does not throw when emitting to a type with no listeners', () => {
        const bus = new EventBus<TestEvent>();
        expect(() => bus.emit('foo', { type: 'foo', value: 1 })).not.toThrow();
    });

    it('continues calling other listeners when one throws', () => {
        const bus = new EventBus<TestEvent>();
        const throwing = vi.fn(() => {
            throw new Error('boom');
        });
        const safe = vi.fn();
        bus.on('foo', throwing);
        bus.on('foo', safe);
        expect(() => bus.emit('foo', { type: 'foo', value: 1 })).not.toThrow();
        expect(safe).toHaveBeenCalledOnce();
    });

    it('clear() removes all listeners across all types', () => {
        const bus = new EventBus<TestEvent>();
        const handler = vi.fn();
        bus.on('foo', handler);
        bus.on('bar', handler);
        bus.clear();
        bus.emit('foo', { type: 'foo', value: 1 });
        bus.emit('bar', { type: 'bar', value: 2 });
        expect(handler).not.toHaveBeenCalled();
    });

    it('calls listener with the correct event payload', () => {
        const bus = new EventBus<TestEvent>();
        const handler = vi.fn();
        bus.on('bar', handler);
        bus.emit('bar', { type: 'bar', value: 99 });
        expect(handler).toHaveBeenCalledWith({ type: 'bar', value: 99 });
    });

    it('same listener can be added for multiple types independently', () => {
        const bus = new EventBus<TestEvent>();
        const handler = vi.fn();
        bus.on('foo', handler);
        bus.on('bar', handler);
        bus.emit('foo', { type: 'foo', value: 1 });
        bus.emit('bar', { type: 'bar', value: 2 });
        expect(handler).toHaveBeenCalledTimes(2);
    });
});
