import {
  Animation,
  type AnimationRange,
  type AnimationFrame,
  type AnimationValue,
} from "../animation";
import type { EasignDescription } from "./easing-description";

interface Easing {
  easing: (t: number) => number;
  velocity: (t: number) => number;
  maxVelocity: number;
  maxVelocityTime: number;
  minVelocityTime: number;
  minAccelecration: number;
}

function createEasing(
  f: (t: number) => number,
  fv: (t: number) => number,
  fa: (t: number) => number,
  c: number,
): Easing {
  const a0 = c === 0 ? 0 : fa(0) / c;

  const fneg =
    a0 === 0 ? (t: number) => c * f(-t / c) : (t: number) => (a0 / 2) * t * t;

  const fvneg = a0 === 0 ? (t: number) => -fv(-t / c) : (t: number) => a0 * t;

  const easing = (t: number) => {
    if (c < t) return (c - 1) * f((1 - t) / (1 - c)) + 1;
    if (t < 0) return fneg(t);
    return c * f(t / c);
  };

  const velocity = (t: number) => {
    if (c < t) return fv((1 - t) / (1 - c));
    if (t < 0) return fvneg(t);
    return fv(t / c);
  };

  return {
    easing,
    velocity,
    maxVelocity: fv(1),
    maxVelocityTime: c,
    minVelocityTime: minimize((t) => Math.abs(1 - easing(t)), -1, 0),
    minAccelecration: -fa(minimize((t) => -fa(t), 0, 1)) / (1 - c),
  };
}

const easeInOutQuad = createEasing(
  (t) => t * t,
  (t) => 2 * t,
  (t) => 2,
  0.5,
);

function lerp(lower: number, upper: number, t: number) {
  return lower + t * (upper - lower);
}

/**
 * For a convex downward function f: R -> R, finds x that minimizes f(x) between [lower, upper].
 */
function minimize(
  f: (t: number) => number,
  lower: number,
  upper: number,
  minWidth = 0.000001,
) {
  const PHI = (1 + Math.sqrt(5)) / 2;
  const MAX_ITERATIONS = 1000;

  // Execute golden-section search untill the width of search range gets less than minWidth
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const xa = lerp(lower, upper, 1 / (PHI + 1));
    const xb = lerp(lower, xa, 1 + 1 / PHI);
    const fa = f(xa);
    const fb = f(xb);

    if (fa < fb) {
      upper = xb;
    } else {
      lower = xa;
    }

    if (upper - lower < minWidth) {
      break;
    }
  }

  return (lower + upper) / 2;
}

interface SolveResult {
  timeScale: number;
  curveScale: number;
}

/**
 * Calculates the easing time `t` and scaling factor `s` from `x`, a difference to a target value, and current velocity `v`.
 * The easing curve is multiplied by (abs(s), sign(s) * s^2) so that the acceleration remains unchanged.
 * The sign of `s` denotes the the easing direction.
 */
function solve(
  easing: Easing,
  distance: number,
  velocity: number,
): SolveResult {
  // Force set t = 0 in the cases below
  if (velocity === 0 || easing.minVelocityTime === 0) {
    return {
      timeScale: 0,
      curveScale: Math.sqrt(Math.abs(distance)) * Math.sign(distance),
    };
  }

  if (distance < 0) {
    const { timeScale, curveScale } = solve(easing, -distance, -velocity);
    return { timeScale, curveScale: -curveScale };
  }

  // In the following code, x > 0 and v != 0 are guaranteed

  // Returns the difference between the distance traveled and x, assuming t to be some value.
  // This is used at later for finding t that minimizes f(t)
  const f = (t: number) => {
    const vt = easing.velocity(t);
    if (vt === 0) {
      return Infinity;
    }
    const s = velocity / vt;
    const _x = s * s * Math.sign(s) * (1 - easing.easing(t));
    return Math.abs(_x - distance);
  };

  // When turning back in the opposite direction
  if (velocity < 0) {
    // Find t between [tmin, 0]
    const timeScale = minimize(f, easing.minVelocityTime, 0);
    const curveScale = velocity / easing.velocity(timeScale);
    return { timeScale, curveScale };
  }

  // The minimum distance traveled from current speed `v`
  // when decelerating continuously at minimum acceleration
  const xmin = ((1 / 2) * (velocity * velocity)) / -easing.minAccelecration;

  // Overshoot when the minimum braking distance exceeds the distance
  if (distance <= xmin) {
    // console.log("OVERSHOOT")
    const timeScale = minimize(f, -100, easing.minVelocityTime);
    const curveScale = velocity / easing.velocity(timeScale);
    // const _x = s * s * Math.sign(s) * (1 - easing(t));
    return { timeScale, curveScale };
  }

  // When the easing function is scaled by (s, s^2),
  // its derivative function is equally scaled by `s`.
  // Thus the maximum velocity after the scaling is `vmax * s`.
  // The maximum value of velocity must be greater than the current velocity,
  // so the minimum value of `s`, `smin`, is obtained.
  // By vmax * smin === v,
  const smin = velocity / easing.maxVelocity;

  const xThreshold =
    (1 - easing.easing(easing.maxVelocityTime)) * Math.pow(smin, 2);

  let tLower, tUpper;

  if (xThreshold < distance) {
    // If re-accelation is needed
    [tLower, tUpper] = [0, easing.maxVelocityTime];
  } else {
    // If only deaccelation is needed
    [tLower, tUpper] = [easing.maxVelocityTime, 1];
  }
  const timeScale = minimize(f, tLower, tUpper);
  const curveScale = velocity / easing.easing(timeScale);

  return { timeScale, curveScale };
}

export class EasingAnimation extends Animation {
  private readonly _description: EasignDescription;
  private readonly _duration: number;
  private readonly _solved: SolveResult;

  /**
   *
   * @param range
   * @param acceleration The acceleration in units per second per second.
   */
  constructor(
    range: AnimationRange,
    description: EasignDescription,
    duration: number,
  ) {
    super(range);
    this._description = description;
    this._duration = duration;
    const { from, to, velocity } = this._range;
    this._solved = solve(easeInOutQuad, to - from, velocity || 0);

    console.log({ solved: this._solved });
  }

  value(frame: AnimationFrame): AnimationValue {
    const durationSeconds = this._duration / 1000;
    const elapsedTimeSeconds = frame.elapsedTime / 1000;
    const { from, to } = this._range;
    const { timeScale, curveScale } = this._solved;
    /*
    const progress =
      Math.min(elapsedTimeSeconds / durationSeconds, 1.0) * (1 - timeScale);
    const distance = to - from;
    const easingOutput = easeInOutQuad.easing(progress);
    const position = from + distance * easingOutput;
    const v = easeInOutQuad.velocity(progress);

    console.log(1 - timeScale);
*/

    const p =
      Math.min(elapsedTimeSeconds / durationSeconds, 1.0) *
      (1 - Math.abs(timeScale));

    const valueScale = Math.pow(curveScale, 2) * Math.sign(curveScale);
    const pos = from + valueScale * easeInOutQuad.easing(p);
    const v = easeInOutQuad.velocity(p) * curveScale;

    //console.log(position, v);
    /*
  
    const initialVelocity = velocity || 0;

    const distance = to - from;

    const res = {
      position:
        to -
        position(
          distance,
          initialVelocity,
          durationSeconds,
          elapsedTimeSeconds,
        ),
      velocity: speed(
        distance,
        initialVelocity,
        durationSeconds,
        elapsedTimeSeconds,
      ),
      completed: elapsedTimeSeconds >= durationSeconds,
    };
*/
    return {
      position: pos,
      velocity: v,
      completed: elapsedTimeSeconds >= durationSeconds,
    };
  }
}
