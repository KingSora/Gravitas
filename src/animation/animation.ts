export interface AnimationValue {
  /** The current position of the animation. */
  position: number;
  /** The current velocity of the animation. */
  velocity: number;
  /** Whether the animation is completed. */
  completed: boolean;
}

export abstract class Animation {
  /**
   * Returns the animation value at the given elapsed time.
   * @param elapsedTime Time in milliseconds since the animation started.
   */
  abstract value(elapsedTime: number): AnimationValue;
}
