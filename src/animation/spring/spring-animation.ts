import {
  Animation,
  type AnimationFrame,
  type AnimationRange,
  type AnimationValue,
} from "../animation";
import type { SpringDescription } from "./spring-description";

const nearEqual = (a: number, b: number, epsilon: number) =>
  (a > b - epsilon && a < b + epsilon) || a == b;
const nearZero = (a: number, epsilon: number) => nearEqual(a, 0, epsilon);

export class SpringAnimation extends Animation {
  private readonly _solver: (
    elapsedSeconds: number,
  ) => Pick<AnimationValue, "position" | "velocity">;

  public readonly description: SpringDescription;

  constructor(range: AnimationRange, description: SpringDescription) {
    super(range);

    this.description = description;

    const { from, to, velocity: initialVelocity } = range;
    const { type, physical } = description;
    const { damping, mass, stiffness } = physical;
    const distance = from - to;
    const e = Math.E;
    const velocity = initialVelocity || 0;

    switch (type) {
      case "overDamped": {
        const mck = damping * damping - 4 * mass * stiffness;
        const sqrtMck = Math.sqrt(mck);
        const r1 = (-damping - sqrtMck) / (2.0 * mass);
        const r2 = (-damping + sqrtMck) / (2.0 * mass);
        const c2 = (velocity - r1 * distance) / (r2 - r1);
        const c1 = distance - c2;

        this._solver = (elapsedSeconds) => {
          return {
            position:
              c1 * Math.pow(e, r1 * elapsedSeconds) +
              c2 * Math.pow(e, r2 * elapsedSeconds),
            velocity:
              c1 * r1 * Math.pow(e, r1 * elapsedSeconds) +
              c2 * r2 * Math.pow(e, r2 * elapsedSeconds),
          };
        };
        break;
      }
      case "underDamped": {
        const w =
          Math.sqrt(4.0 * mass * stiffness - damping * damping) / (2.0 * mass);
        const r = -(damping / 2.0 / mass);
        const c2 = (velocity - r * distance) / w;

        this._solver = (elapsedSeconds) => {
          const pow = Math.pow(e, r * elapsedSeconds);
          const cos = Math.cos(w * elapsedSeconds);
          const sin = Math.sin(w * elapsedSeconds);

          return {
            position:
              Math.pow(e, r * elapsedSeconds) *
              (distance * Math.cos(w * elapsedSeconds) +
                c2 * Math.sin(w * elapsedSeconds)),
            velocity:
              pow * (c2 * w * cos - distance * w * sin) +
              r * pow * (c2 * sin + distance * cos),
          };
        };
        break;
      }
      case "criticallyDamped": {
        const r = -damping / (2 * mass);
        const c2 = velocity - r * distance;

        this._solver = (elapsedSeconds) => {
          const pow = Math.pow(e, r * elapsedSeconds);
          return {
            position:
              (distance + c2 * elapsedSeconds) *
              Math.pow(e, r * elapsedSeconds),
            velocity: r * (distance + c2 * elapsedSeconds) * pow + c2 * pow,
          };
        };
        break;
      }
    }
  }

  value(frame: AnimationFrame): AnimationValue {
    const { position, velocity } = this._solver(frame.elapsedTime / 1000);
    const completed = nearZero(position, 0.001) && nearZero(velocity, 0.001);

    return {
      position: this._range.to + (completed ? 0 : position),
      velocity,
      completed,
    };
  }
}
