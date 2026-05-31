import type {
  PalettePreview,
  PalettePreviewStreamTone,
  PalettePrimaryBundleRow,
} from "./palette-live-preview";

/** Node library icon pulse — at most one pulse start per second. */
export const PALETTE_LIVE_ICON_PULSE_THROTTLE_MS = 1000;

/** Peak flash tint during library icon pulse (emerald-400). */
export const PALETTE_LIVE_ICON_PULSE_PEAK_HEX = "#34d399";

export function getPalettePreviewStreamTone(
  preview: PalettePreview,
): PalettePreviewStreamTone | null {
  switch (preview.kind) {
    case "unavailable":
    case "value":
      return null;
    case "pulse":
    case "primaryBundle":
    case "scalar":
    case "vector3":
    case "quaternion":
      return preview.streamMode;
  }
}

function bundleRowPulseKey(row: PalettePrimaryBundleRow): string {
  switch (row.kind) {
    case "vector3":
      return `${row.label}:${row.vector.x},${row.vector.y},${row.vector.z}`;
    case "quaternion":
      return `${row.label}:${row.quaternion.w},${row.quaternion.x},${row.quaternion.y},${row.quaternion.z}`;
    case "scalar":
      return `${row.label}:${row.value}`;
  }
}

/**
 * Fingerprint of the live reading shown in a library row — changes when telemetry updates.
 * Returns null when idle / no reading (no GSAP pulse).
 */
export function getPalettePreviewPulseKey(preview: PalettePreview): string | null {
  switch (preview.kind) {
    case "primaryBundle":
      if (preview.streamMode === "idle") {
        return null;
      }
      return preview.rows.map(bundleRowPulseKey).join("|");
    case "vector3":
      if (preview.streamMode === "idle") {
        return null;
      }
      return `${preview.handleId}:${preview.vector.x},${preview.vector.y},${preview.vector.z}`;
    case "quaternion":
      if (preview.streamMode === "idle") {
        return null;
      }
      return `q:${preview.quaternion.w},${preview.quaternion.x},${preview.quaternion.y},${preview.quaternion.z}`;
    case "scalar":
      if (preview.streamMode === "idle") {
        return null;
      }
      return `s:${preview.value}`;
    case "value":
      if (preview.streamMode === "idle") {
        return null;
      }
      return `${preview.text}:${preview.unit ?? ""}`;
    case "pulse":
    case "unavailable":
      return null;
  }
}

export function paletteIconPulseFromPreview(preview: PalettePreview): {
  livePulse: PalettePreviewStreamTone | null;
  pulseTriggerKey: string | null;
} {
  const livePulse = getPalettePreviewStreamTone(preview);
  const pulseTriggerKey = getPalettePreviewPulseKey(preview);
  return { livePulse, pulseTriggerKey };
}
