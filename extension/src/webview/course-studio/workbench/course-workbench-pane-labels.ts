/** Display labels for Course Studio workbench pane chrome (PaneFrame headers, drag ghosts, menus). */
export const COURSE_WORKBENCH_PANE_LABELS = {
  outline: "Course Outline",
  content: "Page Editor",
  inspector: "Inspector",
  diagram: "Diagram Editor",
  markdown: "Markdown Editor",
  "html-page": "HTML Editor",
  "scene-3d": "3D Scene Editor",
} as const satisfies Record<string, string>;
