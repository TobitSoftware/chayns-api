import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlockRegistry } from '../../src/utils/history/BlockRegistry';
import { mockLayer } from './helpers';

describe('BlockRegistry', () => {
    // -------------------------------------------------------------------------
    // add / remove
    // -------------------------------------------------------------------------

    describe('add', () => {
        it('returns an unsubscribe function', () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            const unsubscribe = registry.add(layer as any, async () => true);
            expect(typeof unsubscribe).toBe('function');
        });

        it('calling unsubscribe removes the block so navigation is allowed', async () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            const unsubscribe = registry.add(layer as any, async () => false);
            unsubscribe();
            expect(await registry.checkBlocks(layer as any)).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // removeAllForLayer
    // -------------------------------------------------------------------------

    describe('removeAllForLayer', () => {
        it('removes all blocks registered for a layer', async () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            registry.add(layer as any, async () => false);
            registry.add(layer as any, async () => false);
            registry.removeAllForLayer('A');
            expect(await registry.checkBlocks(layer as any)).toBe(true);
        });

        it('does nothing when the layer id is unknown', () => {
            const registry = new BlockRegistry();
            expect(() => registry.removeAllForLayer('nonexistent')).not.toThrow();
        });
    });

    // -------------------------------------------------------------------------
    // collectApplicableBlocks
    // -------------------------------------------------------------------------

    describe('collectApplicableBlocks', () => {
        it('collects all blocks on the target layer (both local and global scope)', () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            registry.add(layer as any, async () => true, { scope: 'local' });
            registry.add(layer as any, async () => true, { scope: 'global' });
            const blocks = registry.collectApplicableBlocks(layer as any);
            expect(blocks).toHaveLength(2);
        });

        it('returns empty array when no blocks are registered on the target', () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            expect(registry.collectApplicableBlocks(layer as any)).toHaveLength(0);
        });

        it('includes global-scoped blocks from active child descendants', () => {
            const registry = new BlockRegistry();
            const child = mockLayer('child');
            const parent = mockLayer('parent', 'child', { child: child as any });

            registry.add(parent as any, async () => true, { scope: 'local' }); // on target → included
            registry.add(child as any, async () => true, { scope: 'local' });  // local child → NOT included
            registry.add(child as any, async () => true, { scope: 'global' }); // global child → included

            const blocks = registry.collectApplicableBlocks(parent as any);
            expect(blocks).toHaveLength(2);
        });

        it('does not collect local-scoped blocks from child layers', () => {
            const registry = new BlockRegistry();
            const child = mockLayer('child');
            const parent = mockLayer('parent', 'child', { child: child as any });

            registry.add(child as any, async () => false, { scope: 'local' });

            const blocks = registry.collectApplicableBlocks(parent as any);
            expect(blocks).toHaveLength(0);
        });

        it('does not collect global blocks from inactive children', () => {
            const registry = new BlockRegistry();
            const inactive = mockLayer('inactive');
            // parent's activeChildId is null → no active child
            const parent = mockLayer('parent', null, { inactive: inactive as any });

            registry.add(inactive as any, async () => false, { scope: 'global' });

            const blocks = registry.collectApplicableBlocks(parent as any);
            expect(blocks).toHaveLength(0);
        });
    });

    // -------------------------------------------------------------------------
    // checkBlocks
    // -------------------------------------------------------------------------

    describe('checkBlocks', () => {
        it('returns true when no blocks are registered', async () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            expect(await registry.checkBlocks(layer as any)).toBe(true);
        });

        it('returns true when all blocks return true', async () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            registry.add(layer as any, async () => true);
            registry.add(layer as any, async () => true);
            expect(await registry.checkBlocks(layer as any)).toBe(true);
        });

        it('returns false when any block returns false', async () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            registry.add(layer as any, async () => true);
            registry.add(layer as any, async () => false);
            expect(await registry.checkBlocks(layer as any)).toBe(false);
        });

        it('returns false when a block callback throws', async () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            registry.add(layer as any, async () => {
                throw new Error('oops');
            });
            expect(await registry.checkBlocks(layer as any)).toBe(false);
        });

        it('returns false when a block times out (after 30s)', async () => {
            vi.useFakeTimers();
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            registry.add(layer as any, () => new Promise(() => {})); // never resolves

            const promise = registry.checkBlocks(layer as any);
            await vi.runAllTimersAsync();
            expect(await promise).toBe(false);
            vi.useRealTimers();
        });

        it('runs all block callbacks in parallel', async () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            const order: number[] = [];

            registry.add(layer as any, async () => {
                await new Promise((r) => setTimeout(r, 10));
                order.push(1);
                return true;
            });
            registry.add(layer as any, async () => {
                await new Promise((r) => setTimeout(r, 5));
                order.push(2);
                return true;
            });

            await registry.checkBlocks(layer as any);
            // Both callbacks ran (parallel execution means order may vary)
            expect(order).toContain(1);
            expect(order).toContain(2);
        });
    });

    // -------------------------------------------------------------------------
    // beforeunload listener management
    // -------------------------------------------------------------------------

    describe('beforeunload listener', () => {
        let addSpy: ReturnType<typeof vi.spyOn>;
        let removeSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            addSpy = vi.spyOn(window, 'addEventListener');
            removeSpy = vi.spyOn(window, 'removeEventListener');
        });

        afterEach(() => {
            addSpy.mockRestore();
            removeSpy.mockRestore();
        });

        it('attaches beforeunload listener when first isBeforeUnload block is added', () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            registry.add(layer as any, async () => true, { isBeforeUnload: true });
            expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        });

        it('does not attach beforeunload listener for regular blocks', () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            registry.add(layer as any, async () => true);
            const calls = addSpy.mock.calls.filter(([type]) => type === 'beforeunload');
            expect(calls).toHaveLength(0);
        });

        it('removes beforeunload listener when last isBeforeUnload block is unsubscribed', () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            const unsubscribe = registry.add(layer as any, async () => true, { isBeforeUnload: true });
            unsubscribe();
            expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        });

        it('does not remove listener while other isBeforeUnload blocks remain', () => {
            const registry = new BlockRegistry();
            const layer = mockLayer('A');
            const unsub1 = registry.add(layer as any, async () => true, { isBeforeUnload: true });
            registry.add(layer as any, async () => true, { isBeforeUnload: true });
            removeSpy.mockClear();
            unsub1();
            const calls = removeSpy.mock.calls.filter(([type]) => type === 'beforeunload');
            expect(calls).toHaveLength(0);
        });
    });
});
