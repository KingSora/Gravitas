import { createPromiseWithResolvers } from "../create-promise-with-resolvers";
import type { Animation } from "./animation";
import {
  AnimationLoop,
  type AnimationLoopOptions,
  type AnimationProgress,
} from "./animation-loop";
import type { AnimationStopReason } from "./animation-stop-reason";

export type AnimationOptions = AnimationLoopOptions;
export type SucceedingAnimateToParameters = (
  state: AnimationProgress | null,
) => AnimateParameters;

export interface AnimateParameters {
  animation: Animation;
  options?: AnimationOptions | null;
}

export interface AnimateResult {
  /** The animation. */
  animation: Animation;
  /** Whether the animation completed. */
  completed: boolean;
  /** The reason why the animation stopped. */
  stopReason: AnimationStopReason;
  /** The animation progress of the last frame. */
  stopProgress: AnimationProgress;
}

export class AnimationController {
  private _animationProgress: AnimationProgress | null = null;
  private _animationLoop: AnimationLoop | null = null;

  get animating() {
    return !!this._animationLoop?.animating;
  }

  stop(reason?: AnimationStopReason) {
    if (this._animationLoop) {
      this._animationLoop.stop(reason || { type: "stopped" });
    }
  }

  animate(
    parameters: AnimateParameters | SucceedingAnimateToParameters,
  ): Promise<AnimateResult> {
    const { animation, options } =
      typeof parameters === "function"
        ? parameters(this._animationProgress)
        : parameters;

    const { promise, resolve } = createPromiseWithResolvers<AnimateResult>();

    this.stop({ type: "succeeded", promise });
    this._animationLoop = new AnimationLoop(animation, {
      ...options,
      onFrame: (frameProgress) => {
        options?.onFrame?.(frameProgress);

        this._animationProgress = frameProgress;
      },
      onStop: (stopProgress, stopReason) => {
        options?.onStop?.(stopProgress, stopReason);

        const { completed } = stopProgress;
        this._animationProgress = completed ? null : stopProgress;

        resolve({ animation, completed, stopReason, stopProgress });
      },
    });

    this._animationLoop.start();

    return promise;
  }
}
