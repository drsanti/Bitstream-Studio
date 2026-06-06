import type {
  LiveReadingStreamTone,
  LiveScalarReadingColorHints,
} from "./live-reading-colors";
import { resolveLiveScalarReadingKind } from "./live-reading-colors";
import { resolveReadingAxisFromHandleOrLabel } from "./param-axis-classes";

/** Canvas / legend hex aligned with socket-row Tailwind semantic tints. */
const IDLE_HEX = "#71717a";

const AXIS_HEX = {
  x: "#fca5a5",
  y: "#6ee7b7",
  z: "#7dd3fc",
  w: "#f9a8d4",
} as const;

const SCALAR_KIND_HEX = {
  temperature: "#fb923c",
  humidity: "#22d3ee",
  pressure: "#c084fc",
  neutral: "#f4f4f5",
} as const;

/** Resolve a plot / legend hex from the same hints as socket live previews. */
export function resolveScalarSemanticColorHex(
  hints: LiveScalarReadingColorHints & { streamMode?: LiveReadingStreamTone },
  fallbackHex: string,
): string {
  if (hints.streamMode === "idle") {
    return IDLE_HEX;
  }
  const axis = resolveReadingAxisFromHandleOrLabel(hints.handleId, hints.label);
  if (axis != null) {
    return AXIS_HEX[axis];
  }
  const kind = resolveLiveScalarReadingKind(hints);
  if (kind === "neutral") {
    return fallbackHex;
  }
  return SCALAR_KIND_HEX[kind];
}
