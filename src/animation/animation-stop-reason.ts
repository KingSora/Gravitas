import type { AnimateResult } from "./animation-controller";

export type AnimationStopReason =
  | {
      type: "succeeded";
      /** The promise for the animate result of the successor animation. */
      promise: Promise<AnimateResult>;
    }
  | {
      type: "completed";
    }
  | {
      type: "stopped";
    };
