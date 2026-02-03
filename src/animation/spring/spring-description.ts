export type SpringType = "criticallyDamped" | "overDamped" | "underDamped";

export interface PhysicalSpringDescription {
  /**
   * The mass of the spring. (m)
   * The greater the mass, the larger the amplitude of oscillation, and the longer the time to return to the equilibrium position.
   */
  mass: number;
  /**
   * The damping coefficient. (c)
   * A number without physical meaning that describes the oscillation and decay.
   * The larger the damping, the fewer oscillations and smaller the amplitude of the elastic motion.
   */
  damping: number;
  /**
   * The spring stiffness. (k)
   * A stiff spring applies more force to the object that is attached.
   */
  stiffness: number;
}

export interface VisualSpringDescription {
  /** Defines how bouncy the spring is in the range of -1..1.
   * `1` describes a `underDamped` spring that oscillates indefinitely.
   * `0` describes a `criticallyDamped` spring with no oscillation.
   * `-1` describes a `overDamped` spring.
   */
  bounce: number;
  /** Defines the visual duration of the spring in seconds. */
  duration: number;
}

export class SpringDescription {
  private readonly _physicalDescription: PhysicalSpringDescription;
  private readonly _visualDescription: VisualSpringDescription;
  private readonly _dampingRatio: number;

  static physical({
    mass,
    damping,
    stiffness,
  }: PhysicalSpringDescription): SpringDescription {
    const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
    return new SpringDescription(
      dampingRatio,
      {
        mass,
        damping,
        stiffness,
      },
      {
        duration: Math.sqrt((4 * Math.PI * Math.PI * mass) / stiffness),
        bounce: dampingRatio < 1 ? 1 - dampingRatio : 1 / dampingRatio - 1,
      },
    );
  }

  static visual({
    bounce,
    duration,
  }: VisualSpringDescription): SpringDescription {
    const dampingRatio = bounce > 0 ? 1 - bounce : 1 / (bounce + 1);
    const mass = 1;
    const stiffness = (4 * Math.PI * Math.PI * mass) / Math.pow(duration, 2);
    const damping = dampingRatio * 2 * Math.sqrt(mass * stiffness);

    return new SpringDescription(
      dampingRatio,
      { mass, damping, stiffness },
      {
        duration,
        bounce,
      },
    );
  }

  private constructor(
    dampingRatio: number,
    physcialDescription: PhysicalSpringDescription,
    visualDescription: VisualSpringDescription,
  ) {
    this._dampingRatio = dampingRatio;
    this._physicalDescription = physcialDescription;
    this._visualDescription = visualDescription;
  }

  /**
   * The spring type derived from the damping ratio.
   */
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

  /**
   * The damping ratio. (ζ)
   */
  get dampingRatio(): number {
    return this._dampingRatio;
  }

  /**
   * The physical spring description.
   */
  get physical(): PhysicalSpringDescription {
    return this._physicalDescription;
  }

  /**
   * The visual spring description.
   */
  get visual(): VisualSpringDescription {
    return this._visualDescription;
  }
}
