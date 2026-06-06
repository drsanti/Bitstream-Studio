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
