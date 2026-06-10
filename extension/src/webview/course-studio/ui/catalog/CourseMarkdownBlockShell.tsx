import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { PresentationTheoryMarkdown } from "../../../presentation/components/PresentationTheoryMarkdown";
import type { MarkdownBlockColors } from "../../schemas/markdownBlockColors";
import { markdownBlockColorsToStyle } from "../../schemas/markdownBlockColors";
import { useMarkdownEditorPreviewNavigation } from "../../maintainer/markdown-editor/MarkdownEditorPreviewNavigationContext";

export const COURSE_MARKDOWN_BLOCK_SHELL_FILL_CLASS =
  "course-block-markdown course-block-markdown--fill h-full min-h-0 overflow-y-auto scrollbar-hide rounded-xl border border-[var(--surface-border)] px-4 py-3";

export const COURSE_MARKDOWN_BLOCK_SHELL_CONTENT_CLASS =
  "course-block-markdown course-block-markdown--content h-auto min-h-0 overflow-visible rounded-xl border border-[var(--surface-border)] px-4 py-3";

/** @deprecated Use {@link COURSE_MARKDOWN_BLOCK_SHELL_FILL_CLASS}. */
export const COURSE_MARKDOWN_BLOCK_SHELL_CLASS = COURSE_MARKDOWN_BLOCK_SHELL_FILL_CLASS;

export type CourseMarkdownShellHeight = "fill" | "content";

function courseMarkdownShellClass(height: CourseMarkdownShellHeight): string {
  return height === "content"
    ? COURSE_MARKDOWN_BLOCK_SHELL_CONTENT_CLASS
    : COURSE_MARKDOWN_BLOCK_SHELL_FILL_CLASS;
}

export function CourseMarkdownBlockShell({
  colors,
  className,
  height = "fill",
  children,
}: {
  colors?: MarkdownBlockColors;
  className?: string;
  /** `fill` — edit grid cell; `content` — read mode auto height. */
  height?: CourseMarkdownShellHeight;
  children: ReactNode;
}) {
  return (
    <div
      className={twMerge(courseMarkdownShellClass(height), className)}
      style={markdownBlockColorsToStyle(colors)}
    >
      {children}
    </div>
  );
}

export function CourseMarkdownBlockContent({
  markdown,
  colors,
  className,
  height = "fill",
  onSourceLineClick,
}: {
  markdown: string;
  colors?: MarkdownBlockColors;
  className?: string;
  height?: CourseMarkdownShellHeight;
  /** Overrides workbench preview navigation when set explicitly. */
  onSourceLineClick?: (line: number) => void;
}) {
  const previewNavigation = useMarkdownEditorPreviewNavigation();
  const sourceLineHandler = onSourceLineClick ?? previewNavigation ?? undefined;

  return (
    <CourseMarkdownBlockShell colors={colors} className={className} height={height}>
      <PresentationTheoryMarkdown
        markdown={markdown}
        colors={colors}
        onSourceLineClick={sourceLineHandler}
      />
    </CourseMarkdownBlockShell>
  );
}
