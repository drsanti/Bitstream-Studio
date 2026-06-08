import {
  coerceFlowWireAnimationV1,
  type FlowWireAnimationClipV1,
  type FlowWireAnimationV1,
} from "./flow-wire-animation";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function mergeClipLayers(
  base: FlowWireAnimationClipV1,
  overlay: FlowWireAnimationClipV1,
): FlowWireAnimationClipV1 {
  return {
    timeS: overlay.timeS,
    speed: overlay.speed !== undefined ? overlay.speed : base.speed,
    enabled: overlay.enabled !== undefined ? overlay.enabled : base.enabled,
    loopMode: overlay.loopMode ?? base.loopMode,
    trimStartS: overlay.trimStartS ?? base.trimStartS,
    trimEndS: overlay.trimEndS ?? base.trimEndS,
    fadeInMs: overlay.fadeInMs ?? base.fadeInMs,
    fadeOutMs: overlay.fadeOutMs ?? base.fadeOutMs,
    weight: overlay.weight !== undefined ? overlay.weight : base.weight,
    markers: overlay.markers ?? base.markers,
    maskPreset: overlay.maskPreset ?? base.maskPreset,
    followInspectorPlayhead: overlay.followInspectorPlayhead ?? base.followInspectorPlayhead,
    restartOnSolo: overlay.restartOnSolo ?? base.restartOnSolo,
  };
}

/**
 * Merge partial `glbAnimation` wires left-to-right.
 * **Policy:** for each clip name, later inputs override defined fields on earlier clips.
 * Top-level wire fields (`soloClipName`, `playbackMode`, …) — last non-empty wins.
 */
export function mergeFlowWireAnimationsV1(
  wires: ReadonlyArray<FlowWireAnimationV1 | null | undefined>,
): FlowWireAnimationV1 {
  const result: FlowWireAnimationV1 = { version: 1, clips: {} };

  for (const raw of wires) {
    if (raw == null) {
      continue;
    }
    const wire = coerceFlowWireAnimationV1(raw);

    if (wire.soloClipName !== undefined) {
      result.soloClipName = wire.soloClipName;
    }
    if (wire.playbackMode != null) {
      result.playbackMode = wire.playbackMode;
    }
    if (wire.clipOrder != null) {
      result.clipOrder = [...wire.clipOrder];
    }
    if (wire.inspectorTransportActive != null) {
      result.inspectorTransportActive = wire.inspectorTransportActive;
    }

    for (const [name, clip] of Object.entries(wire.clips)) {
      const key = name.trim();
      if (key.length === 0) {
        continue;
      }
      const prev = result.clips[key];
      result.clips[key] = prev != null ? mergeClipLayers(prev, clip) : { ...clip };
    }
  }

  return result;
}

function scaleWireClipWeights(args: {
  wire: FlowWireAnimationV1 | null | undefined;
  weightScale: number;
  fadeInMs: number;
  fadeOutMs: number;
}): FlowWireAnimationV1 {
  const coerced = coerceFlowWireAnimationV1(args.wire ?? { version: 1, clips: {} });
  const clips: Record<string, FlowWireAnimationClipV1> = {};
  const scale = args.weightScale;

  for (const [name, clip] of Object.entries(coerced.clips)) {
    const key = name.trim();
    if (key.length === 0 || clip.enabled === false) {
      continue;
    }
    const baseWeight = typeof clip.weight === "number" && Number.isFinite(clip.weight) ? clip.weight : 1;
    const next: FlowWireAnimationClipV1 = {
      ...clip,
      weight: clamp01(baseWeight * scale),
    };
    if (args.fadeInMs > 0) {
      next.fadeInMs = args.fadeInMs;
    }
    if (args.fadeOutMs > 0) {
      next.fadeOutMs = args.fadeOutMs;
    }
    clips[key] = next;
  }

  return { version: 1, clips, playbackMode: "parallel-all" };
}

/**
 * Blend two partial animation wires with factor **0 = A only**, **1 = B only**.
 * Weights are **multiplicative** (not re-normalized): `wA = w * (1 - factor)`, `wB = w * factor`.
 * Optional **crossfadeS** sets `fadeOutMs` on A clips and `fadeInMs` on B clips for the mixer.
 */
export function blendFlowWireAnimationsV1(args: {
  wireA: FlowWireAnimationV1 | null | undefined;
  wireB: FlowWireAnimationV1 | null | undefined;
  factor: number;
  crossfadeS?: number;
}): FlowWireAnimationV1 {
  const factor = clamp01(args.factor);
  const aScale = 1 - factor;
  const bScale = factor;
  const crossfadeMs =
    typeof args.crossfadeS === "number" && Number.isFinite(args.crossfadeS) && args.crossfadeS > 0
      ? args.crossfadeS * 1000
      : 0;

  const scaledA = scaleWireClipWeights({
    wire: args.wireA,
    weightScale: aScale,
    fadeInMs: 0,
    fadeOutMs: crossfadeMs,
  });
  const scaledB = scaleWireClipWeights({
    wire: args.wireB,
    weightScale: bScale,
    fadeInMs: crossfadeMs,
    fadeOutMs: 0,
  });

  return mergeFlowWireAnimationsV1([scaledA, scaledB]);
}

function normalizeNonNegativeWeights(weights: readonly number[]): number[] {
  const safe = weights.map((w) => (Number.isFinite(w) ? Math.max(0, w) : 0));
  const sum = safe.reduce((acc, w) => acc + w, 0);
  if (sum <= 0) {
    const each = safe.length > 0 ? 1 / safe.length : 0;
    return safe.map(() => each);
  }
  return safe.map((w) => w / sum);
}

/**
 * Mix N partial animation wires with per-input weights.
 * Scales each wire's clip weights, then merges in parallel (`parallel-all`).
 * When **normalize** is true (default), weights are normalized to sum to 1.
 */
export function mixFlowWireAnimationsV1(args: {
  wires: ReadonlyArray<FlowWireAnimationV1 | null | undefined>;
  weights: readonly number[];
  normalize?: boolean;
}): FlowWireAnimationV1 {
  const resolved =
    args.normalize !== false
      ? normalizeNonNegativeWeights(args.weights)
      : args.weights.map((w) => (Number.isFinite(w) ? Math.max(0, w) : 0));

  const scaled = args.wires.map((wire, index) =>
    scaleWireClipWeights({
      wire,
      weightScale: resolved[index] ?? 0,
      fadeInMs: 0,
      fadeOutMs: 0,
    }),
  );

  return mergeFlowWireAnimationsV1(scaled);
}

/** Count enabled clips on a wire (for compact node chrome). */
export function countFlowWireAnimationClips(
  wire: FlowWireAnimationV1 | null | undefined,
): number {
  if (wire == null) {
    return 0;
  }
  const coerced = coerceFlowWireAnimationV1(wire);
  return Object.values(coerced.clips).filter((c) => c.enabled !== false).length;
}
