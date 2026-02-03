import type { Animation, AnimationFrame, AnimationValue } from "./animation";
import { type AnimationStopReason } from "./animation-stop-reason";

export interface AnimationProgress extends AnimationValue, AnimationFrame {
  /** The animation. */
  animation: Animation;
}

export interface AnimationLoopOptions {
  /** Progress information which is used to seamlessly connect this animation loop to a previous animation loop. */
  progress?: AnimationProgress | null;
  /** Callback invoked when the loop starts. */
  onStart?: (startProgress: AnimationProgress) => void;
  /** Callback invoked whenever a frame is ready. */
  onFrame?: (frameProgress: AnimationProgress) => void;
  /** Callback invoked when the loop stops. */
  onStop?: (
    stopProgress: AnimationProgress,
    stopReason: AnimationStopReason,
  ) => void;
}

interface AnimationLoopState {
  abortController: AbortController;
  firstProgress: AnimationProgress | null;
  latestProgress: AnimationProgress | null;
  rafId: number | null;
}

export class AnimationLoop {
  private _loopState: AnimationLoopState | null = null;
  private readonly _options: AnimationLoopOptions;
  public readonly animation: Animation;

  constructor(animation: Animation, options?: AnimationLoopOptions) {
    this.animation = animation;
    this._options = options || {};
  }

  get animating() {
    return !!this._loopState;
  }

  start() {
    this.stop({ type: "stopped" });

    const abortController = new AbortController();
    const loopState: AnimationLoopState = (this._loopState = {
      abortController,
      firstProgress: null,
      latestProgress: null,
      rafId: null,
    });

    abortController.signal.addEventListener("abort", () => {
      const { reason } = abortController.signal;
      const { rafId, latestProgress } = loopState;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (latestProgress) {
        this._options.onStop?.(latestProgress, reason);
      }
    });

    loopState.rafId = requestAnimationFrame(() =>
      this.update(performance.now(), (newRafId) => {
        loopState.rafId = newRafId;
      }),
    );
  }

  stop(reason: AnimationStopReason) {
    if (this._loopState) {
      this._loopState.abortController.abort(reason);
      this._loopState = null;
    }
  }

  private update(time: number, rafIdCallback: (rafId: number) => void) {
    if (!this._loopState || this._loopState.abortController.signal.aborted) {
      return;
    }

    const { firstProgress, latestProgress } = this._loopState;
    const animation = this.animation;
    const startTime =
      latestProgress?.startTime || this._options.progress?.time || time;
    const animationFrame = {
      startTime,
      time: Math.max(startTime, time),
      elapsedTime: Math.max(0, time - startTime),
      frame: latestProgress ? latestProgress.frame + 1 : 0,
    };
    const animationValue = animation.value(animationFrame);
    const animationProgress = {
      animation,
      ...animationValue,
      ...animationFrame,
    };

    if (!firstProgress) {
      this._loopState.firstProgress = animationProgress;
      this._options.onStart?.(animationProgress);
    }

    this._loopState.latestProgress = animationProgress;
    this._options.onFrame?.(animationProgress);

    if (animationValue.completed) {
      this.stop({ type: "completed" });
      return;
    }

    rafIdCallback(
      requestAnimationFrame(() =>
        this.update(performance.now(), rafIdCallback),
      ),
    );
  }
}
