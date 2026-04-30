import type { HistoryLayer } from './HistoryLayer';
import type { BlockOptions } from './types';
import { devWarn } from './guards/devWarn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlockEntry {
    readonly id: string;
    readonly callback: () => Promise<boolean>;
    readonly opts: Required<BlockOptions>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BLOCK_TIMEOUT_MS = 30_000;
let _nextId = 1;

// ---------------------------------------------------------------------------
// BlockRegistry
// ---------------------------------------------------------------------------

export class BlockRegistry {
    /** Per-layer block list. */
    private readonly layerBlocks = new Map<string, Set<BlockEntry>>();

    /** Number of blocks with `isBeforeUnload: true`. When > 0, listener is attached. */
    private beforeUnloadCount = 0;
    private readonly beforeUnloadHandler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
    };

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    add(
        layer: HistoryLayer,
        callback: () => Promise<boolean>,
        opts: BlockOptions = {},
    ): () => void {
        const entry: BlockEntry = {
            id: String(_nextId++),
            callback,
            opts: {
                scope: opts.scope ?? 'local',
                isBeforeUnload: opts.isBeforeUnload ?? false,
            },
        };

        let set = this.layerBlocks.get(layer.id);
        if (!set) {
            set = new Set();
            this.layerBlocks.set(layer.id, set);
        }
        set.add(entry);

        if (entry.opts.isBeforeUnload) {
            this.incrementBeforeUnload();
        }

        return () => this.remove(layer.id, entry);
    }

    remove(layerId: string, entry: BlockEntry): void {
        const set = this.layerBlocks.get(layerId);
        if (!set) return;
        set.delete(entry);
        if (set.size === 0) this.layerBlocks.delete(layerId);
        if (entry.opts.isBeforeUnload) {
            this.decrementBeforeUnload();
        }
    }

    /** Remove all blocks registered for a layer (called on destroy). */
    removeAllForLayer(layerId: string): void {
        const set = this.layerBlocks.get(layerId);
        if (!set) return;
        for (const entry of set) {
            if (entry.opts.isBeforeUnload) this.decrementBeforeUnload();
        }
        this.layerBlocks.delete(layerId);
    }

    // -------------------------------------------------------------------------
    // Collection
    // -------------------------------------------------------------------------

    /**
     * Collects all blocks applicable to a navigation targeting `targetLayer`.
     *
     * Rules:
     * - `local` blocks: only those registered on `targetLayer`.
     * - `global` blocks: those registered on `targetLayer` or any of its
     *   **active-chain descendants** (not inactive subtrees).
     */
    collectApplicableBlocks(targetLayer: HistoryLayer): BlockEntry[] {
        const result: BlockEntry[] = [];

        // Local blocks on the target layer.
        const localSet = this.layerBlocks.get(targetLayer.id);
        if (localSet) {
            for (const entry of localSet) {
                result.push(entry);
            }
        }

        // Global blocks on active-chain descendants.
        this.collectGlobalFromActiveDescendants(targetLayer, result);

        return result;
    }

    private collectGlobalFromActiveDescendants(
        layer: HistoryLayer,
        out: BlockEntry[],
    ): void {
        const activeChildId = layer.getActiveChildId();
        if (!activeChildId) return;

        const child = layer.getChildLayer(activeChildId);
        if (!child) return;

        const childSet = this.layerBlocks.get(child.id);
        if (childSet) {
            for (const entry of childSet) {
                if (entry.opts.scope === 'global') {
                    out.push(entry);
                }
            }
        }

        this.collectGlobalFromActiveDescendants(child, out);
    }

    // -------------------------------------------------------------------------
    // Checking
    // -------------------------------------------------------------------------

    /**
     * Runs all applicable block callbacks in parallel.
     * Returns `true` if navigation is allowed (no block), `false` otherwise.
     * Callbacks that throw or time out count as blocked (with dev-warn).
     */
    async checkBlocks(targetLayer: HistoryLayer): Promise<boolean> {
        const blocks = this.collectApplicableBlocks(targetLayer);
        if (blocks.length === 0) return true;

        const results = await Promise.all(
            blocks.map((b) => this.runBlock(b)),
        );
        return results.every(Boolean);
    }

    private async runBlock(entry: BlockEntry): Promise<boolean> {
        try {
            const result = await Promise.race([
                entry.callback(),
                new Promise<false>((resolve) =>
                    setTimeout(() => {
                        devWarn(
                            'BLOCK_TIMEOUT',
                            `Block callback id="${entry.id}" timed out after ${BLOCK_TIMEOUT_MS}ms — navigation blocked.`,
                        );
                        resolve(false);
                    }, BLOCK_TIMEOUT_MS),
                ),
            ]);
            return result;
        } catch (err) {
            devWarn('BLOCK_THREW', `Block callback id="${entry.id}" threw — navigation blocked.`, err);
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // beforeunload counter
    // -------------------------------------------------------------------------

    private incrementBeforeUnload(): void {
        this.beforeUnloadCount++;
        if (this.beforeUnloadCount === 1 && typeof window !== 'undefined') {
            window.addEventListener('beforeunload', this.beforeUnloadHandler);
        }
    }

    private decrementBeforeUnload(): void {
        if (this.beforeUnloadCount === 0) return;
        this.beforeUnloadCount--;
        if (this.beforeUnloadCount === 0 && typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        }
    }
}
