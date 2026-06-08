import { useCourseMarkdownEditorStore } from "../maintainer/useCourseMarkdownEditorStore";
import pilotTheoryMd from "./pilot-bmi-accel-theory.theory.md?raw";

export const PILOT_ACCEL_THEORY_MD_SRC = "pilot-bmi-accel-theory.theory.md";

export const PILOT_ACCEL_THEORY_MD_SOURCE_PATH =
  "src/webview/course-studio/content/pilot-bmi-accel-theory.theory.md";

const BUNDLED_MARKDOWN: Record<string, string> = {
  [PILOT_ACCEL_THEORY_MD_SRC]: pilotTheoryMd,
};

const MARKDOWN_SOURCE_PATHS: Record<string, string> = {
  [PILOT_ACCEL_THEORY_MD_SRC]: PILOT_ACCEL_THEORY_MD_SOURCE_PATH,
};

export function loadCourseMarkdown(src: string): string | null {
  const draft = useCourseMarkdownEditorStore.getState().drafts[src];
  if (draft != null) {
    return draft;
  }
  return BUNDLED_MARKDOWN[src] ?? null;
}

export function getCourseMarkdownSourcePath(src: string): string | null {
  return MARKDOWN_SOURCE_PATHS[src] ?? null;
}

export const COURSE_MARKDOWN_SRCS = Object.keys(BUNDLED_MARKDOWN);

export function initBundledCourseMarkdowns(): void {
  const { initMarkdown } = useCourseMarkdownEditorStore.getState();
  for (const src of COURSE_MARKDOWN_SRCS) {
    const text = BUNDLED_MARKDOWN[src];
    const sourcePath = MARKDOWN_SOURCE_PATHS[src];
    if (text != null && sourcePath != null) {
      initMarkdown(src, text, sourcePath);
    }
  }
}

export function useCourseMarkdown(src: string): string | null {
  const draft = useCourseMarkdownEditorStore((s) => (src ? s.drafts[src] : undefined));
  if (!src) {
    return null;
  }
  if (draft != null) {
    return draft;
  }
  return BUNDLED_MARKDOWN[src] ?? null;
}
