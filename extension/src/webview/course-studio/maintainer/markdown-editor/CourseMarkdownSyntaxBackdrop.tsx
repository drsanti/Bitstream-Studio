import type { MarkdownSyntaxHighlightOptions } from "./markdownSyntaxHighlightHtml";
import { useDebouncedMarkdownSyntaxHtml } from "./useDebouncedMarkdownSyntaxHtml";

export function CourseMarkdownSyntaxBackdrop({
  text,
  highlightOptions,
}: {
  text: string;
  highlightOptions?: MarkdownSyntaxHighlightOptions;
}) {
  const html = useDebouncedMarkdownSyntaxHtml(text, highlightOptions);

  return (
    <pre
      className="course-md-editor-highlight-backdrop"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
