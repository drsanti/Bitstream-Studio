export type SweepCurve = "linear" | "log";
export type SweepDirection = "up-down" | "up" | "down";
export type SweepMode = "loop" | "once";

export type OscillatorSweepParams = {
  sweepEnabled: boolean;
  sweepStartHz: number;
  sweepEndHz: number;
  sweepPeriodS: number;
  sweepCurve?: SweepCurve;
  sweepDirection?: SweepDirection;
  sweepMode?: SweepMode;
};

export function readSweepCurve(raw: unknown): SweepCurve {
  return raw === "log" ? "log" : "linear";
}

export function readSweepDirection(raw: unknown): SweepDirection {
  if (raw === "up" || raw === "down") {
    return raw;
  }
  return "up-down";
}

export function readSweepMode(raw: unknown): SweepMode {
  return raw === "once" ? "once" : "loop";
}

function clampSweepPeriodS(raw: number): number {
  return Number.isFinite(raw) ? Math.max(0.25, raw) : 4;
}

function sweepBounds(startHz: number, endHz: number): { lo: number; hi: number } {
  const a = Math.max(1, Number.isFinite(startHz) ? startHz : 220);
  const b = Math.max(1, Number.isFinite(endHz) ? endHz : 880);
  return { lo: Math.min(a, b), hi: Math.max(a, b) };
}

/** Map normalized sweep position 0..1 to Hz. */
export function interpolateSweepHz(
  t: number,
  startHz: number,
  endHz: number,
  curve: SweepCurve,
): number {
  const phase = Math.max(0, Math.min(1, t));
  const { lo, hi } = sweepBounds(startHz, endHz);
  if (curve === "log") {
    return lo * Math.pow(hi / lo, phase);
  }
  return lo + (hi - lo) * phase;
}

/** 0..1 sweep position for the current time slice. */
export function resolveSweepPhase(args: {
  elapsedS: number;
  periodS: number;
  direction: SweepDirection;
  mode: SweepMode;
}): number {
  const periodS = clampSweepPeriodS(args.periodS);
  const elapsedS = Math.max(0, args.elapsedS);

  if (args.mode === "once") {
    const p = Math.min(1, elapsedS / periodS);
    if (args.direction === "up") {
      return p;
    }
    if (args.direction === "down") {
      return 1 - p;
    }
    if (p < 0.5) {
      return p * 2;
    }
    return (1 - p) * 2;
  }

  const cycleT = (elapsedS % periodS) / periodS;
  if (args.direction === "up") {
    return cycleT;
  }
  if (args.direction === "down") {
    return 1 - cycleT;
  }
  return cycleT < 0.5 ? cycleT * 2 : (1 - cycleT) * 2;
}

export function resolveOscillatorSweepHz(args: {
  nowMs: number;
  baseFreqHz: number;
  gate: boolean;
  sweepOnceAnchorMs: number | null;
  params: OscillatorSweepParams;
}): { freqHz: number; nextSweepOnceAnchorMs: number | null } {
  const {
    nowMs,
    baseFreqHz,
    gate,
    sweepOnceAnchorMs,
    params: {
      sweepEnabled,
      sweepStartHz,
      sweepEndHz,
      sweepPeriodS,
      sweepCurve,
      sweepDirection,
      sweepMode,
    },
  } = args;

  if (!sweepEnabled) {
    return { freqHz: baseFreqHz, nextSweepOnceAnchorMs: null };
  }

  const curve = readSweepCurve(sweepCurve);
  const direction = readSweepDirection(sweepDirection);
  const mode = readSweepMode(sweepMode);
  const periodS = clampSweepPeriodS(sweepPeriodS);

  if (mode === "once" && !gate) {
    return { freqHz: baseFreqHz, nextSweepOnceAnchorMs: null };
  }

  let anchorMs = sweepOnceAnchorMs;
  if (mode === "once") {
    if (anchorMs == null) {
      anchorMs = nowMs;
    }
  }

  const elapsedS =
    mode === "once" && anchorMs != null ? (nowMs - anchorMs) / 1000 : nowMs / 1000;

  const phase = resolveSweepPhase({
    elapsedS,
    periodS,
    direction,
    mode,
  });

  const holdAtEnd =
    mode === "once" && elapsedS >= periodS
      ? direction === "down"
        ? 0
        : 1
      : phase;

  return {
    freqHz: interpolateSweepHz(holdAtEnd, sweepStartHz, sweepEndHz, curve),
    nextSweepOnceAnchorMs: mode === "once" ? anchorMs : null,
  };
}
