export interface AnimationFrame {
  /** The timestamp when the animation started. */
  startTime: number;
  /** The current timestamp of the animation. */
  time: number;
  /** The elapsed time since start of the animation. */
  elapsedTime: number;
  /** The number of the current frame. */
  frame: number;
}

export interface AnimationValue {
  /** The position of the animation. */
  position: number;
  /** The velocity of the animation in units per seconds. */
  velocity: number;
  /** Whether the animation is completed. */
  completed: boolean;
}

export interface AnimationRange {
  /** The start position of the animation. */
  from: number;
  /** The end position of the animation. */
  to: number;
  /** The start velocity of the animation in units per seconds. */
  velocity?: number;
}

export abstract class Animation {
  protected readonly _range: AnimationRange;

  constructor(range: AnimationRange) {
    this._range = range;
  }

  get range(): AnimationRange {
    return this._range;
  }

  /**
   * Returns the animation value from the given frame.
   * @param frame The animation frame.
   */
  abstract value(frame: AnimationFrame): AnimationValue;
}
