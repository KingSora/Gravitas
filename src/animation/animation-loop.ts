import type { Animation } from "./animation";
import { type AnimationStopReason } from "./animation-stop-reason";

export interface AnimationProgress {
  /** The animation of which the state is reflected. */
  animation: Animation;
  /** The time when the animation started. */
  startTime: number;
  /** The current time of the animation. */
  time: number;
  /** The elapsed time since start of the animation. */
  elapsedTime: number;
  /** The current frame of the animation. */
  frame: {
    /** The zero-based frame count. */
    count: number;
    /** Whether this is the first frame of the animation. */
    first: boolean;
    /** Whether this is the last frame of the animation. */
    last: boolean;
  };
  /** The current position of the animation. */
  position: number;
  /** The current velocity of the animation. */
  velocity: number;
}

export interface AnimationLoopOptions {
  /** Progress information which is used to seamlessly connect this animation loop to a previous animation loop. */
  progress?: AnimationProgress | null;
  /** Callback invoked when the loop starts. */
  onStart?: (startState: AnimationProgress) => void;
  /** Callback invoked whenever a frame is ready. */
  onFrame?: (frameState: AnimationProgress) => void;
  /** Callback invoked when the loop stops. */
  onStop?: (
    stopState: AnimationProgress,
    stopReason: AnimationStopReason,
  ) => void;
}

interface AnimationLoopState {
  abortController: AbortController;
  startState: AnimationProgress | null;
  latestState: AnimationProgress | null;
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
      startState: null,
      latestState: null,
      rafId: null,
    });

    abortController.signal.addEventListener("abort", () => {
      const { reason } = abortController.signal;
      const { rafId, latestState } = loopState;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (latestState) {
        this._options.onStop?.(latestState, reason);
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

    const { latestState, startState } = this._loopState;
    const animation = this.animation;
    const elapsedTime = Math.max(
      0,
      time - (latestState?.startTime || this._options.progress?.time || time),
    );
    const firstFrame = !startState;
    const { position, velocity, completed } = animation.value(elapsedTime);

    const animationState = {
      animation,
      startTime: latestState ? latestState.startTime : time,
      time,
      elapsedTime,
      frame: {
        count: latestState ? latestState.frame.count + 1 : 0,
        first: firstFrame,
        last: completed,
      },
      position,
      velocity,
    };

    if (firstFrame) {
      this._loopState.startState = animationState;
      this._options.onStart?.(animationState);
    }

    this._loopState.latestState = animationState;
    this._options.onFrame?.(animationState);

    if (completed) {
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
