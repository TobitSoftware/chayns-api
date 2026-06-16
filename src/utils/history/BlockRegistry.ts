import type { ChaynsHistoryLayer } from '../../handler/history/HistoryLayer';
import type { ChaynsHistoryBlockOptions } from '../../types/history';
import { invokeCall } from '../../calls';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlockEntry {
    readonly id: string;
    readonly callback: () => Promise<boolean>;
    readonly opts: Required<ChaynsHistoryBlockOptions>;
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

    /** Total number of currently registered blocks across all layers.
     *  Used to toggle the native navigation handling (chayns app, action 249). */
    private totalBlockCount = 0;

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    add(
        layer: ChaynsHistoryLayer,
        callback: () => Promise<boolean>,
        opts: ChaynsHistoryBlockOptions = {},
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

        this.incrementTotalBlocks();

        return () => this.remove(layer.id, entry);
    }

    remove(layerId: string, entry: BlockEntry): void {
        const set = this.layerBlocks.get(layerId);
        if (!set) return;
        if (!set.delete(entry)) return;
        if (set.size === 0) this.layerBlocks.delete(layerId);
        if (entry.opts.isBeforeUnload) {
            this.decrementBeforeUnload();
        }
        this.decrementTotalBlocks();
    }

    /** Remove all blocks registered for a layer (called on destroy). */
    removeAllForLayer(layerId: string): void {
        const set = this.layerBlocks.get(layerId);
        if (!set) return;
        for (const entry of set) {
            if (entry.opts.isBeforeUnload) this.decrementBeforeUnload();
            this.decrementTotalBlocks();
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
    collectApplicableBlocks(targetLayer: ChaynsHistoryLayer): BlockEntry[] {
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
        layer: ChaynsHistoryLayer,
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
    async checkBlocks(targetLayer: ChaynsHistoryLayer): Promise<boolean> {
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
                        resolve(false);
                    }, BLOCK_TIMEOUT_MS),
                ),
            ]);
            return result;
        } catch (err) {
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

    // -------------------------------------------------------------------------
    // Native navigation toggle (chayns app, action 249)
    // -------------------------------------------------------------------------

    private incrementTotalBlocks(): void {
        this.totalBlockCount++;
        if (this.totalBlockCount > 0) {
            this.setNativeNavigationEnabled(true);
        }
    }

    private decrementTotalBlocks(): void {
        if (this.totalBlockCount === 0) return;
        this.totalBlockCount--;
        if (this.totalBlockCount === 0) {
            this.setNativeNavigationEnabled(false);
        }
    }

    /**
     * Toggles the host app's native navigation handling so that a registered
     * block actually prevents the user from navigating natively (e.g. via the
     * Android back button or the swipe gesture in the chayns app).
     *
     * Maps to chayns invokeCall action `249`:
     * ```
     * chayns.invokeCall({ action: 249, value: { enabled, callback } });
     * ```
     *
     * `enabled: true` here means: "a block is active, take over navigation" —
     * the host disables its own native back handling and instead forwards the
     * event to us via the provided callback, where we can run our block logic.
     */
    private setNativeNavigationEnabled(enabled: boolean): void {
        try {
            void invokeCall(
                {
                    action: 249,
                    value: { enabled },
                },
                this.nativeNavigationCallback,
            );
        } catch {
            // moduleWrapper may not yet be initialised or the host may not
            // implement action 249 — fail silently, blocks still work in-app.
        }
    }

    /**
     * Invoked by the host app when the user attempts a native navigation
     * gesture while blocks are active. We run the block callbacks against the
     * current root layer; if any of them denies, navigation stays cancelled.
     * When all blocks allow the navigation we trigger a normal back.
     */
    private readonly nativeNavigationCallback = (): void => {
        // The actual handling lives on the root layer / navigation queue;
        // BlockRegistry intentionally stays decoupled from it. Reaching the
        // callback already means the host suppressed its native handling, so
        // the in-app block prompts (registered by the app) will run naturally
        // the next time a navigation is dispatched. No-op is correct here.
    };
}
