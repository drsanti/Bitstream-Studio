import * as THREE from "three";

export type GlbClipOverlapPair = {
  clipA: string;
  clipB: string;
  sharedTargets: string[];
};

export type GlbClipOverlapReport = {
  /** Animated property paths per clip (`node.property`). */
  clipTrackTargets: Record<string, string[]>;
  overlappingPairs: GlbClipOverlapPair[];
  /** Heuristic for parallel-all safety. */
  parallelRisk: "low" | "medium" | "high";
  summary: string;
};

const DEFAULT_CLIP_FPS = 30;

export function clipFrameFromTime(timeS: number, fps = DEFAULT_CLIP_FPS): number {
  return Math.max(0, Math.floor(timeS * fps));
}

export function formatClipTimecode(timeS: number, fps = DEFAULT_CLIP_FPS): string {
  const frame = clipFrameFromTime(timeS, fps);
  const whole = Math.floor(timeS);
  const frac = timeS - whole;
  const centis = Math.floor(frac * 100);
  return `${whole}.${centis.toString().padStart(2, "0")}s · f${frame}`;
}

function trackTargetKey(track: THREE.KeyframeTrack): string {
  const parsed = THREE.PropertyBinding.parseTrackName(track.name);
  const node = parsed.nodeName.length > 0 ? parsed.nodeName : "(root)";
  return `${node}.${parsed.propertyName}`;
}

function collectClipTargets(clip: THREE.AnimationClip): string[] {
  const set = new Set<string>();
  for (const track of clip.tracks) {
    set.add(trackTargetKey(track));
  }
  return [...set].sort();
}

function assessParallelRisk(pairs: GlbClipOverlapPair[], clipCount: number): GlbClipOverlapReport["parallelRisk"] {
  if (clipCount <= 1) {
    return "low";
  }
  if (pairs.length === 0) {
    return "low";
  }
  const maxShared = pairs.reduce((m, p) => Math.max(m, p.sharedTargets.length), 0);
  const pairRatio = pairs.length / Math.max(1, (clipCount * (clipCount - 1)) / 2);
  if (maxShared >= 8 || pairRatio > 0.45) {
    return "high";
  }
  if (maxShared >= 2 || pairRatio > 0.15) {
    return "medium";
  }
  return "low";
}

function buildSummary(risk: GlbClipOverlapReport["parallelRisk"], pairs: GlbClipOverlapPair[]): string {
  if (pairs.length === 0) {
    return "Clips animate disjoint targets — parallel-all is usually safe.";
  }
  if (risk === "high") {
    return `${pairs.length} overlapping clip pair(s) — prefer per-clip or sequence, not parallel-all.`;
  }
  if (risk === "medium") {
    return `${pairs.length} pair(s) share bones — parallel-all may fight on shared tracks.`;
  }
  return "Minor overlap — parallel-all may still be acceptable.";
}

/**
 * Read-only overlap analysis from GLTF animation clip track names.
 */
export function analyzeGlbClipOverlap(args: {
  clips: readonly THREE.AnimationClip[];
  clipNames: readonly string[];
}): GlbClipOverlapReport {
  const { clips, clipNames } = args;
  const clipTrackTargets: Record<string, string[]> = {};

  for (let i = 0; i < clips.length; i += 1) {
    const name = clipNames[i] ?? clips[i]?.name ?? `clip-${i}`;
    clipTrackTargets[name] = collectClipTargets(clips[i]!);
  }

  const overlappingPairs: GlbClipOverlapPair[] = [];
  const names = clipNames.length > 0 ? [...clipNames] : Object.keys(clipTrackTargets);

  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const a = names[i]!;
      const b = names[j]!;
      const setA = new Set(clipTrackTargets[a] ?? []);
      const shared = (clipTrackTargets[b] ?? []).filter((t) => setA.has(t));
      if (shared.length > 0) {
        overlappingPairs.push({ clipA: a, clipB: b, sharedTargets: shared });
      }
    }
  }

  const parallelRisk = assessParallelRisk(overlappingPairs, names.length);
  return {
    clipTrackTargets,
    overlappingPairs,
    parallelRisk,
    summary: buildSummary(parallelRisk, overlappingPairs),
  };
}
