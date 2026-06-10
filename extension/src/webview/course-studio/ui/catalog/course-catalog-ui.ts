import {
  BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS,
} from "../../../bitstream-shell/ui/workspace-chrome-chip";

/** Block chrome labels — matches Course Studio inspector title scale (11px). */
export const COURSE_CATALOG_BLOCK_LABEL_CLASS =
  "truncate font-sans text-[11px] font-semibold uppercase leading-none tracking-wide text-[var(--text-muted)]";

/** Live / frozen status chips — same frame as topbar telemetry badges (21px, py-1). */
export const COURSE_CATALOG_STATUS_CHIP_CLASS = `${BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS} h-[21px] ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS} shrink-0`;

/** Live canvas status — shared by 2D diagram blocks and editable 3D scene blocks. */
export function courseLiveCanvasStatusLabel(
  hasLiveBindings: boolean,
  liveActive: boolean,
): string {
  if (!hasLiveBindings) {
    return "Static";
  }
  return liveActive ? "Live canvas" : "Frozen";
}

/** Orbit / zoom helper copy over embedded R3F scenes (10px, tight leading). */
export const COURSE_CATALOG_SCENE_HINT_CLASS =
  "presentation-scene-controls-hint absolute bottom-2 right-2 rounded border border-[var(--surface-border)] bg-[var(--surface-panel)]/95 px-2 py-0.5 font-sans text-[10px] font-medium leading-none tracking-wide text-[var(--text-muted)] opacity-95";
