import {
  Animation,
  type AnimationRange,
  type AnimationFrame,
  type AnimationValue,
} from "../animation";

export class GravityAnimation extends Animation {
  private readonly _acceleration: number;

  /**
   *
   * @param range
   * @param acceleration The acceleration in units per second per second.
   */
  constructor(range: AnimationRange, acceleration: number) {
    super(range);
    this._acceleration = acceleration;
  }

  value(frame: AnimationFrame): AnimationValue {
    const elapsedTimeSeconds = frame.elapsedTime / 1000;
    const { from, to, velocity: initialVelocity } = this._range;
    const iv = initialVelocity || 0;

    const distance = from - to;
    const directionMultiplier = to > from ? 1 : -1;
    const directionalAcceleration = this._acceleration * directionMultiplier;
    const appliedAcceleration =
      directionalAcceleration * elapsedTimeSeconds * elapsedTimeSeconds;
    const deltaPosition = iv * elapsedTimeSeconds + 0.5 * appliedAcceleration;
    const position = from + deltaPosition;
    const velocity = iv + elapsedTimeSeconds * directionalAcceleration;
    const completed = Math.abs(deltaPosition) >= Math.abs(distance);

    return {
      position: completed ? to : position,
      velocity,
      completed,
    };
  }
}
