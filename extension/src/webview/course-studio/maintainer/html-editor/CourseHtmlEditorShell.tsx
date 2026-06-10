import type { ReactNode } from "react";
import { wrapHtmlDocumentIfNeeded, resolveHtmlPageSandboxAttr } from "../../schemas/htmlPageBlocks";
import { COURSE_EMBED_CARD_IFRAME_CLASS } from "../../ui/catalog/course-embed-card-ui";

export type CourseHtmlEditorShellProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  variant?: "workbench" | "embedded";
  ariaLabel?: string;
  headerSlot?: ReactNode;
  sandboxSameOrigin?: boolean;
};

export function CourseHtmlEditorShell({
  value,
  onChange,
  readOnly = false,
  variant = "workbench",
  ariaLabel = "HTML source",
  headerSlot,
  sandboxSameOrigin,
}: CourseHtmlEditorShellProps) {
  const srcDoc = wrapHtmlDocumentIfNeeded(value);
  const sandbox = resolveHtmlPageSandboxAttr({ sandboxSameOrigin });
  const isWorkbench = variant === "workbench";

  return (
    <div
      className={
        isWorkbench
          ? "course-html-editor course-html-editor--workbench flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          : "course-html-editor course-html-editor--embedded flex min-h-0 flex-col gap-2"
      }
    >
      {headerSlot}
      <div
        className={
          isWorkbench
            ? "flex min-h-0 flex-1 overflow-hidden"
            : "flex min-h-[16rem] flex-col gap-2 overflow-hidden"
        }
      >
        <div
          className={
            isWorkbench
              ? "flex min-h-0 min-w-0 flex-1 flex-col border-r border-[var(--surface-border)]"
              : "flex min-h-0 flex-col"
          }
        >
          <div className="shrink-0 border-b border-[var(--surface-border)] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Source
          </div>
          <textarea
            className="scrollbar-hide min-h-0 flex-1 resize-none border-0 bg-zinc-950/40 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-100 outline-none"
            value={value}
            readOnly={readOnly}
            aria-label={ariaLabel}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        <div className={isWorkbench ? "flex min-h-0 min-w-0 flex-1 flex-col" : "flex min-h-[12rem] flex-col"}>
          <div className="shrink-0 border-b border-[var(--surface-border)] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Preview
          </div>
          <div className="relative min-h-0 flex-1 bg-zinc-950/60">
            {srcDoc.length > 0 ? (
              <iframe
                className={COURSE_EMBED_CARD_IFRAME_CLASS}
                title="HTML preview"
                sandbox={sandbox}
                srcDoc={srcDoc}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[var(--text-muted)]">
                Enter HTML to preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
