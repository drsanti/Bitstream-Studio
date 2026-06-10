export const SCENE_3D_EDITOR_SHORTCUT_LINES = [
  "Alt+LMB drag — Orbit",
  "Alt+Shift+LMB drag — Pan",
  "Scroll — Zoom",
  "Shift+A — Add object menu",
  "G / R / S — Move / Rotate / Scale gizmo",
  "Ctrl+G — Group selected",
  "Ctrl+P — Set Parent To menu",
  "Alt+P — Clear Parent menu",
  "1 / 3 / 7 / 9 — Front / Right / Top / Back view",
  "5 — Toggle perspective / orthographic",
  "Shift+click — Add / extend selection",
  "Drag empty — Box select",
  "Shift+drag empty — Add to selection",
  "Ctrl+D — Duplicate selection",
  "Delete — Remove selection",
  "Ctrl+Z / Ctrl+Shift+Z — Undo / Redo",
] as const;

export function formatScene3dEditorShortcutsHint(): string {
  return SCENE_3D_EDITOR_SHORTCUT_LINES.join(" · ");
}
