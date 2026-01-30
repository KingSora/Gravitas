export interface PhysicalSpringParameters {
  readonly type: "physical";
  readonly mass: number;
  readonly stiffness: number;
  readonly damping: number;
}

export interface VisualSpringParameters {
  /** Duration in seconds. */
  readonly duration: number;
  readonly bounce: number;
}

export type SpringParameters =
  | PhysicalSpringParameters
  | VisualSpringParameters;

export type SpringType = "criticallyDamped" | "overDamped" | "underDamped";

export class SpringAnimationDescription {
  public readonly mass: number;
  public readonly stiffness: number;
  public readonly damping: number;

  static physical(
    mass: number,
    damping: number,
    stiffness: number,
  ): SpringAnimationDescription {
    return new SpringAnimationDescription(mass, damping, stiffness);
  }

  static visual(duration: number, bounce: number): SpringAnimationDescription {
    const dampingRatio = bounce > 0 ? 1 - bounce : 1 / (bounce + 1);
    const mass = 1;
    const stiffness = (4 * Math.PI * Math.PI * mass) / Math.pow(duration, 2);
    const damping = dampingRatio * 2 * Math.sqrt(mass * stiffness);

    return new SpringAnimationDescription(mass, damping, stiffness);
  }

  private constructor(mass: number, damping: number, stiffness: number) {
    this.mass = mass;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  get dampingRatio(): number {
    return this.damping * this.damping - 4 * this.mass * this.stiffness;
  }

  get type(): SpringType {
    const dampingRatio = this.dampingRatio;

    if (dampingRatio < 1) {
      return "underDamped";
    }

    if (dampingRatio > 1) {
      return "overDamped";
    }

    return "criticallyDamped";
  }

  get duration(): number {
    return Math.sqrt((4 * Math.PI * Math.PI * this.mass) / this.stiffness);
  }

  get bounce(): number {
    const dampingRatio = this.dampingRatio;
    return dampingRatio < 1 ? 1 - dampingRatio : 1 / dampingRatio - 1;
  }
}
