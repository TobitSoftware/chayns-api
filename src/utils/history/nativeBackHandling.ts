import { getDevice, invokeCall } from '../../calls';
import type { ChaynsHistoryLayer } from '../../handler/history/HistoryLayer';
import { AppFlavor } from '../../types/IChaynsReact';
import type { BlockRegistry } from './BlockRegistry';
import { getCurrentIdx } from './navigationIndex';
import { hasWindowHistory } from './window';

const DISABLE_SWIPE_BACK_GESTURE_ACTION = 249;

export interface NativeBackHandlerOptions {
    rootLayer: ChaynsHistoryLayer;
    blockRegistry: BlockRegistry;
}

/**
 * Coordinates the native swipe-back gesture (Chayns app action 249) with the
 * JS history queue.
 *
 * Why we disable the gesture as soon as the user has navigated inside the app
 * (`getCurrentIdx() > 0`) and not only while a block is registered:
 *   The native swipe animation runs independently of our JS handling. Without
 *   intercepting it, a swipe-back would (a) play the native pop animation,
 *   (b) pop the browser entry, (c) fire popstate, and only THEN would the
 *   queue evaluate the block and silently push forward again — producing the
 *   "navigate back, then snap forward" jitter described in the bug report.
 *   By intercepting from the first own history entry on, every back must come
 *   through the registered callback where we can resolve blocks before
 *   mutating history.
 *
 * Instances are scoped to a single root layer; module-level state is avoided
 * so re-inits (HMR, tests, multiple roots) cannot desynchronise.
 */
export class NativeBackHandler {
    private readonly opts: NativeBackHandlerOptions;
    private isInterceptionEnabled: boolean | undefined;
    /**
     * Set to `true` right before `history.back()` is triggered from
     * {@link handleNativeBack}. Consumed by the popstate listener so the
     * queue can skip the duplicate block check (we already ran it).
     */
    private bypassNextPopstateBlockCheck = false;

    constructor(opts: NativeBackHandlerOptions) {
        this.opts = opts;
    }

    /** Re-evaluates the desired native gesture state and pushes it to the app. */
    sync = (): void => {
        if (!hasWindowHistory() || !NativeBackHandler.isSupported()) {
            return;
        }

        const next = this.shouldEnableInterception();
        if (this.isInterceptionEnabled === next) {
            return;
        }

        void invokeCall(
            {
                action: DISABLE_SWIPE_BACK_GESTURE_ACTION,
                value: { enabled: next },
            },
            next ? this.handleNativeBack : undefined,
        );

        this.isInterceptionEnabled = next;
    };

    /**
     * Returns `true` exactly once after a {@link handleNativeBack}-initiated
     * `history.back()`. The popstate listener uses this so the queue can skip
     * the (already performed) block check.
     */
    consumeBypassFlag(): boolean {
        if (!this.bypassNextPopstateBlockCheck) return false;
        this.bypassNextPopstateBlockCheck = false;
        return true;
    }

    private static isSupported(): boolean {
        try {
            return getDevice().app?.flavor === AppFlavor.Chayns;
        } catch {
            return false;
        }
    }

    private shouldEnableInterception(): boolean {
        return (
            this.opts.blockRegistry.hasActiveBlocks(this.opts.rootLayer) ||
            getCurrentIdx() > 0
        );
    }

    private handleNativeBack = (): void => {
        void this.runNativeBack();
    };

    private async runNativeBack(): Promise<void> {
        const isAllowed = await this.opts.blockRegistry.checkActiveBlocks(
            this.opts.rootLayer,
        );
        if (!isAllowed || !hasWindowHistory()) {
            return;
        }

        this.bypassNextPopstateBlockCheck = true;
        window.history.back();
    }
}
