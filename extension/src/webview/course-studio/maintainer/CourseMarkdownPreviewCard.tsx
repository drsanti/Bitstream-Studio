import { Eye } from "lucide-react";
import type { PageBlockV1 } from "../schemas/page.v1";
import { loadCourseMarkdown } from "../content/markdownRegistry";
import { useRemoteMarkdown } from "../content/useRemoteMarkdown";
import { resolveMarkdownBlockEffectiveColors } from "../runtime/resolveBlockColors";
import { CourseMarkdownBlockContent } from "../ui/catalog/CourseMarkdownBlockShell";
import { useCourseOutlineStore } from "./useCourseOutlineStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import {
  COURSE_INSPECTOR_CARD_ICON_CLASS,
  CourseInspectorCard,
} from "./CourseInspectorCard";
import { useCourseMarkdownEditorStore } from "./useCourseMarkdownEditorStore";

export function CourseMarkdownPreviewCard({
  block,
  markdown,
  loading = false,
  error = null,
  emptyMessage = "Nothing to preview yet.",
}: {
  block: Extract<PageBlockV1, { kind: "markdown" }>;
  markdown: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}) {
  const pageMeta = useCoursePageEditorStore((s) => s.page?.meta);
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);
  const previewColors = resolveMarkdownBlockEffectiveColors(
    block.colors,
    pageMeta,
    courseThemes,
  );

  return (
    <CourseInspectorCard
      id={`${block.id}-markdown-preview`}
      title="Preview"
      titleIcon={<Eye className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Rendered markdown with this block's color style applied."
      defaultExpanded
    >
      <div className="max-h-48 overflow-y-auto scrollbar-hide rounded-md border border-[var(--surface-border)]">
        {loading ? (
          <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">Loading markdown…</p>
        ) : error != null ? (
          <p className="px-3 py-2 text-[11px] text-rose-300/90">{error}</p>
        ) : markdown.trim().length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">{emptyMessage}</p>
        ) : (
          <CourseMarkdownBlockContent
            markdown={markdown}
            colors={previewColors}
            className="max-h-48 rounded-md border-0"
          />
        )}
      </div>
    </CourseInspectorCard>
  );
}

/** Resolves live markdown for preview (inline, bundled file draft, or remote URL). */
export function MarkdownBlockPreviewSection({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "markdown" }>;
}) {
  const src = block.src;
  const remoteUrl = block.url?.trim();
  const fileDraft = useCourseMarkdownEditorStore((s) =>
    src != null ? s.drafts[src] : undefined,
  );
  const remote = useRemoteMarkdown(
    remoteUrl != null && remoteUrl.length > 0 ? remoteUrl : undefined,
  );

  if (src != null) {
    const markdown = fileDraft ?? loadCourseMarkdown(src) ?? "";
    return (
      <CourseMarkdownPreviewCard
        block={block}
        markdown={markdown}
        emptyMessage="Markdown file is empty."
      />
    );
  }

  if (remoteUrl != null && remoteUrl.length > 0) {
    return (
      <CourseMarkdownPreviewCard
        block={block}
        markdown={remote.markdown ?? block.markdown ?? ""}
        loading={remote.loading}
        error={remote.error}
        emptyMessage="Enter a URL to preview markdown."
      />
    );
  }

  return (
    <CourseMarkdownPreviewCard block={block} markdown={block.markdown ?? ""} />
  );
}
