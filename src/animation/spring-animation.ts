import { Animation, type AnimationValue } from "./animation";
import type { SpringAnimationDescription } from "./spring-animation-description";

const nearEqual = (a: number, b: number, epsilon: number) => {
  return (a > b - epsilon && a < b + epsilon) || a == b;
};
const nearZero = (a: number, epsilon: number) => {
  return nearEqual(a, 0, epsilon);
};

export class SpringAnimation extends Animation {
  private readonly _solver: (
    elapsedSeconds: number,
  ) => Pick<AnimationValue, "position" | "velocity">;

  public readonly description: SpringAnimationDescription;
  public readonly from: number;
  public readonly to: number;
  public readonly initialVelocity: number;

  constructor(
    description: SpringAnimationDescription,
    from: number,
    to: number,
    initialVelocity?: number | null | undefined,
  ) {
    super();

    const { damping, mass, stiffness, type } = description;
    const distance = from - to;
    const e = Math.E;
    const velocity = initialVelocity || 0;

    switch (type) {
      case "overDamped": {
        const { damping, mass, stiffness } = description;

        const cmk = damping * damping - 4 * mass * stiffness;
        const sqrtCmk = Math.sqrt(cmk);
        const r1 = (-damping - sqrtCmk) / (2.0 * mass);
        const r2 = (-damping + sqrtCmk) / (2.0 * mass);
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
        const c1 = distance;
        const c2 = (velocity - r * distance) / w;

        this._solver = (elapsedSeconds) => {
          const pow = Math.pow(e, r * elapsedSeconds);
          const cos = Math.cos(w * elapsedSeconds);
          const sin = Math.sin(w * elapsedSeconds);

          return {
            position:
              Math.pow(e, r * elapsedSeconds) *
              (c1 * Math.cos(w * elapsedSeconds) +
                c2 * Math.sin(w * elapsedSeconds)),
            velocity:
              pow * (c2 * w * cos - c1 * w * sin) +
              r * pow * (c2 * sin + c1 * cos),
          };
        };
        break;
      }
      case "criticallyDamped": {
        const r = -damping / (2 * mass);
        const c1 = to - from;
        const c2 = velocity - r * distance;

        this._solver = (elapsedSeconds) => {
          const pow = Math.pow(e, r * elapsedSeconds);
          return {
            position:
              (c1 + c2 * elapsedSeconds) * Math.pow(e, r * elapsedSeconds),
            velocity: r * (c1 + c2 * elapsedSeconds) * pow + c2 * pow,
          };
        };
        break;
      }
    }

    this.description = description;
    this.from = from;
    this.to = to;
    this.initialVelocity = velocity;
  }

  value(elapsedTime: number): AnimationValue {
    const { position, velocity } = this._solver(elapsedTime / 1000);
    const completed = nearZero(position, 0.01) && nearZero(velocity, 0.01);

    return {
      position: this.to + (completed ? 0 : position),
      velocity: completed ? 0 : velocity,
      completed,
    };
  }
}
