import type { PalettePreviewStreamTone } from "./palette-live-preview";
import {
  getLiveScalarReadingColorClass,
  resolveLiveScalarReadingKind,
  type LiveScalarReadingKind,
} from "../../nodes/flow-node/readings/live-reading-colors";

/** @deprecated Prefer `LiveScalarReadingKind` from `live-reading-colors`. */
export type PaletteScalarReadingKind = LiveScalarReadingKind;

export { resolveLiveScalarReadingKind as resolvePaletteScalarReadingKind };

export function getPaletteScalarReadingColorClass(
  streamMode: PalettePreviewStreamTone,
  hints: { unit?: string; label?: string; handleId?: string; nodeId?: string },
): string {
  return getLiveScalarReadingColorClass(streamMode, hints);
}
