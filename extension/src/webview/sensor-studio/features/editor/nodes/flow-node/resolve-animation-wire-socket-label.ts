import {
  coerceFlowWireAnimationV1,
  type FlowWireAnimationV1,
} from "../animation/flow-wire-animation";

/** Prefer `name +N` when the leading clip name fits the socket row. */
const MAX_LEADING_CLIP_NAME_LEN = 12;

function enabledClipNames(wire: FlowWireAnimationV1): string[] {
  const coerced = coerceFlowWireAnimationV1(wire);
  const enabled = Object.entries(coerced.clips)
    .filter(([name, clip]) => name.trim().length > 0 && clip.enabled !== false)
    .map(([name]) => name.trim());

  const order = coerced.clipOrder;
  if (order != null && order.length > 0) {
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const raw of order) {
      const name = raw.trim();
      if (name.length === 0 || !enabled.includes(name) || seen.has(name)) {
        continue;
      }
      ordered.push(name);
      seen.add(name);
    }
    for (const name of [...enabled].sort()) {
      if (!seen.has(name)) {
        ordered.push(name);
      }
    }
    return ordered;
  }

  return [...enabled].sort();
}

function playbackModeShort(mode: FlowWireAnimationV1["playbackMode"]): string | null {
  switch (mode) {
    case "parallel-all":
      return "parallel";
    case "sequence":
      return "sequence";
    case "per-clip":
      return "per-clip";
    default:
      return null;
  }
}

/** Tooltip — full clip list, count, and optional playback mode. */
export function resolveAnimationWireSocketTooltip(
  wire: FlowWireAnimationV1 | null | undefined,
): string {
  if (wire == null) {
    return "";
  }
  const coerced = coerceFlowWireAnimationV1(wire);
  const names = enabledClipNames(coerced);
  if (names.length === 0) {
    return "";
  }

  const parts: string[] = [`${names.length} clip${names.length === 1 ? "" : "s"}`];
  const solo = coerced.soloClipName?.trim();
  const mode = coerced.playbackMode ?? "per-clip";
  if (solo != null && solo.length > 0 && mode === "per-clip") {
    parts.push(`solo ${solo}`);
  } else {
    const modeShort = playbackModeShort(mode);
    if (modeShort != null && names.length > 1) {
      parts.push(modeShort);
    }
  }
  parts.push(names.join(", "));
  return parts.join(" · ");
}

export type ResolveAnimationWireSocketLabelArgs = {
  wire: FlowWireAnimationV1 | null | undefined;
  /** When true and N > 1, append `· parallel` / `· sequence` on bundle outputs. */
  includePlaybackModeSuffix?: boolean;
};

/**
 * Compact socket badge for `glbAnimation` wires.
 * N = 1 → clip name; N > 1 → `name +N` or `N clips`.
 */
export function resolveAnimationWireSocketLabel(
  args: ResolveAnimationWireSocketLabelArgs,
): string {
  const { wire, includePlaybackModeSuffix = false } = args;
  if (wire == null) {
    return "";
  }
  const coerced = coerceFlowWireAnimationV1(wire);
  const names = enabledClipNames(coerced);
  if (names.length === 0) {
    return "";
  }

  const solo = coerced.soloClipName?.trim();
  const mode = coerced.playbackMode ?? "per-clip";
  if (solo != null && solo.length > 0 && mode === "per-clip" && names.includes(solo)) {
    return solo;
  }

  let label: string;
  if (names.length === 1) {
    label = names[0]!;
  } else {
    const first = names[0]!;
    label =
      first.length <= MAX_LEADING_CLIP_NAME_LEN
        ? `${first} +${names.length - 1}`
        : `${names.length} clips`;
  }

  if (includePlaybackModeSuffix && names.length > 1) {
    const modeShort = playbackModeShort(mode);
    if (modeShort != null) {
      label = `${label} · ${modeShort}`;
    }
  }

  return label;
}

export function resolveAnimationWireSocketBadgeText(args: {
  wire: FlowWireAnimationV1 | null | undefined;
  catalogNodeId?: string;
}): { label: string; title: string } {
  const title = resolveAnimationWireSocketTooltip(args.wire);
  const label = resolveAnimationWireSocketLabel({
    wire: args.wire,
    includePlaybackModeSuffix: args.catalogNodeId === "glb-animation-bundle",
  });
  return { label, title: title.length > 0 ? title : label };
}
