export type EasignCurvePosition = (time: number) => number;
export type EasignCurveVelocity = (time: number) => number;

export class EasignDescription {
  private readonly _position: EasignCurvePosition;
  private readonly _velocity: EasignCurveVelocity;

  static curve(
    position: EasignCurvePosition,
    velocity: EasignCurveVelocity,
  ): EasignDescription {
    return new EasignDescription(position, velocity);
  }

  constructor(position: EasignCurvePosition, velocity: EasignCurveVelocity) {
    this._position = position;
    this._velocity = velocity;
  }

  position(time: number): number {
    return this._position(time);
  }

  velocity(time: number): number {
    return this._velocity(time);
  }
}
