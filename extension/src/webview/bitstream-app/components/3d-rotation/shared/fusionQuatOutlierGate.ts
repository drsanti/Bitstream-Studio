/** Normalized fusion quaternion (scalar-first). */
export type FusionQuat4 = {
  qw: number;
  qx: number;
  qy: number;
  qz: number;
};

export type FusionQuatGateState = {
  hasAccepted: boolean;
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  lastCounter: number | null;
  lastAcceptedAtMs: number | null;
};

export type FusionQuatGateRejectReason = "counter_regress" | "angle_spike";

export type FusionQuatGateDecision =
  | { accept: true; aligned: FusionQuat4; nextGate: FusionQuatGateState }
  | {
      accept: false;
      reason: FusionQuatGateRejectReason;
      nextGate: FusionQuatGateState;
    };

/** Max plausible body rate for display gating (deg/s). */
const OMEGA_MAX_DEG_PER_S = 720;
const MIN_STEP_DEG = 12;
const ABS_MAX_STEP_DEG = 50;

const DEG_TO_RAD = Math.PI / 180;
const OMEGA_MAX_RAD_S = OMEGA_MAX_DEG_PER_S * DEG_TO_RAD;
const MIN_STEP_RAD = MIN_STEP_DEG * DEG_TO_RAD;
const ABS_MAX_STEP_RAD = ABS_MAX_STEP_DEG * DEG_TO_RAD;

const DT_MIN_SEC = 0.001;
const DT_MAX_SEC = 0.5;

export function createEmptyFusionQuatGateState(): FusionQuatGateState {
  return {
    hasAccepted: false,
    qw: 1,
    qx: 0,
    qy: 0,
    qz: 0,
    lastCounter: null,
    lastAcceptedAtMs: null,
  };
}

export function fusionQuatDotAbs(a: FusionQuat4, b: FusionQuat4): number {
  return Math.abs(
    a.qw * b.qw + a.qx * b.qx + a.qy * b.qy + a.qz * b.qz,
  );
}

/** Rotation angle between unit quaternions (radians), in [0, π]. */
export function fusionQuatAngleRad(a: FusionQuat4, b: FusionQuat4): number {
  const dot = Math.min(1, fusionQuatDotAbs(a, b));
  return 2 * Math.acos(dot);
}

/** Pick ±q so interpolation follows the short arc vs `reference`. */
export function hemisphereAlignFusionQuatToReference(
  q: FusionQuat4,
  reference: FusionQuat4,
): FusionQuat4 {
  const dot =
    q.qw * reference.qw +
    q.qx * reference.qx +
    q.qy * reference.qy +
    q.qz * reference.qz;
  if (dot >= 0) {
    return q;
  }
  return { qw: -q.qw, qx: -q.qx, qy: -q.qy, qz: -q.qz };
}

function isCounterMonotonic(prev: number, next: number): boolean {
  if (next >= prev) {
    return true;
  }
  // uint32 wrap: treat as forward if the backward gap is "half the ring" or more.
  const backward = prev - next;
  return backward > 0x8000_0000;
}

export function maxAllowedFusionQuatStepRad(
  dtSec: number,
  feedIntervalMs: number,
): number {
  const feedSec =
    typeof feedIntervalMs === "number" && Number.isFinite(feedIntervalMs) && feedIntervalMs > 0
      ? feedIntervalMs / 1000
      : 0.02;
  const dt = Math.max(DT_MIN_SEC, Math.min(DT_MAX_SEC, dtSec > 0 ? dtSec : feedSec));
  const fromRate = OMEGA_MAX_RAD_S * dt;
  const fromFeed = OMEGA_MAX_RAD_S * feedSec * 1.25;
  return Math.min(ABS_MAX_STEP_RAD, Math.max(MIN_STEP_RAD, fromRate, fromFeed));
}

export function evaluateFusionQuatWireFrame(args: {
  enabled: boolean;
  incoming: FusionQuat4;
  incomingCounter: number | undefined;
  gate: FusionQuatGateState;
  nowMs: number;
  feedIntervalMs: number;
}): FusionQuatGateDecision {
  const { enabled, incoming, incomingCounter, gate, nowMs, feedIntervalMs } = args;

  if (!enabled || !gate.hasAccepted) {
    const aligned = gate.hasAccepted
      ? hemisphereAlignFusionQuatToReference(incoming, gate)
      : incoming;
    return {
      accept: true,
      aligned,
      nextGate: {
        hasAccepted: true,
        qw: aligned.qw,
        qx: aligned.qx,
        qy: aligned.qy,
        qz: aligned.qz,
        lastCounter:
          typeof incomingCounter === "number" && Number.isFinite(incomingCounter)
            ? incomingCounter
            : gate.lastCounter,
        lastAcceptedAtMs: nowMs,
      },
    };
  }

  if (
    typeof incomingCounter === "number" &&
    Number.isFinite(incomingCounter) &&
    gate.lastCounter != null &&
    !isCounterMonotonic(gate.lastCounter, incomingCounter)
  ) {
    return { accept: false, reason: "counter_regress", nextGate: gate };
  }

  const aligned = hemisphereAlignFusionQuatToReference(incoming, gate);
  const dtSec =
    gate.lastAcceptedAtMs != null
      ? (nowMs - gate.lastAcceptedAtMs) / 1000
      : feedIntervalMs / 1000;
  const maxStep = maxAllowedFusionQuatStepRad(dtSec, feedIntervalMs);
  const angle = fusionQuatAngleRad(aligned, gate);
  if (angle > maxStep) {
    return { accept: false, reason: "angle_spike", nextGate: gate };
  }

  return {
    accept: true,
    aligned,
    nextGate: {
      hasAccepted: true,
      qw: aligned.qw,
      qx: aligned.qx,
      qy: aligned.qy,
      qz: aligned.qz,
      lastCounter:
        typeof incomingCounter === "number" && Number.isFinite(incomingCounter)
          ? incomingCounter
          : gate.lastCounter,
      lastAcceptedAtMs: nowMs,
    },
  };
}
