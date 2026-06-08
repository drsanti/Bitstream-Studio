/** Transform gizmo mode for Stage Scene Editor (SE2). */
export type StudioViewportGizmoMode = "translate" | "rotate" | "scale";

export const STUDIO_VIEWPORT_GIZMO_MODES: readonly StudioViewportGizmoMode[] = [
  "translate",
  "rotate",
  "scale",
] as const;

export function isStudioViewportGizmoMode(v: unknown): v is StudioViewportGizmoMode {
  return v === "translate" || v === "rotate" || v === "scale";
}
