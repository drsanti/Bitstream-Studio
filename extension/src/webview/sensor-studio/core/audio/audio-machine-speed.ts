export function clampMachineSpeed(raw: unknown, fallback = 0): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, n));
}

export function clampMachineLoad(raw: unknown, fallback = 0): number {
  return clampMachineSpeed(raw, fallback);
}

/** Map normalized speed 0..1 to primary whine frequency (Hz). */
export function resolveMotorWhineHz(args: {
  speed: number;
  whineBaseHz: number;
  whineSpanHz: number;
}): number {
  const speed = clampMachineSpeed(args.speed, 0);
  const base = Math.max(20, args.whineBaseHz);
  const span = Math.max(0, args.whineSpanHz);
  return base + span * speed;
}

/** Ripple AM rate scales with speed — pole-pass feel for electric motors. */
export function resolveMotorRippleHz(whineHz: number, rippleMix: number): number {
  if (rippleMix <= 0.001) {
    return 0;
  }
  return Math.max(4, whineHz * 0.12);
}

/** Low-frequency engine rumble from idle to redline proxy. */
export function resolveEngineRumbleHz(args: {
  speed: number;
  rumbleBaseHz: number;
  rumbleSpanHz: number;
}): number {
  const speed = clampMachineSpeed(args.speed, 0);
  const base = Math.max(18, args.rumbleBaseHz);
  const span = Math.max(0, args.rumbleSpanHz);
  return base + span * speed;
}

/** Firing pulse rate from cylinder count and normalized speed. */
export function resolveEngineFireHz(args: {
  speed: number;
  cylinders: number;
}): number {
  const speed = clampMachineSpeed(args.speed, 0);
  const cylinders = Math.max(1, Math.round(args.cylinders));
  const idleFire = cylinders * 2;
  const maxFire = cylinders * 14;
  return idleFire + (maxFire - idleFire) * speed;
}

/** Drone motor whine center frequency. */
export function resolveDroneMotorHz(args: {
  speed: number;
  motorBaseHz: number;
  motorSpanHz: number;
}): number {
  const speed = clampMachineSpeed(args.speed, 0);
  const base = Math.max(40, args.motorBaseHz);
  const span = Math.max(0, args.motorSpanHz);
  return base + span * speed;
}

/** Detune spread in Hz for multi-motor layering. */
export function resolveDroneDetuneHz(motorHz: number, detuneCents: number): number {
  const cents = Math.max(0, detuneCents);
  return motorHz * (Math.pow(2, cents / 1200) - 1);
}

/** Industrial cycle tone rate from normalized speed. */
export function resolveIndustrialCycleHz(args: {
  speed: number;
  cycleBaseHz: number;
  cycleSpanHz: number;
}): number {
  const speed = clampMachineSpeed(args.speed, 0);
  const base = Math.max(0.2, args.cycleBaseHz);
  const span = Math.max(0, args.cycleSpanHz);
  return base + span * speed;
}
