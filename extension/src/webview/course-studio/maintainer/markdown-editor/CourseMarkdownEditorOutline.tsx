import { useEffect, useMemo, useRef } from "react";
import { twMerge } from "tailwind-merge";
import {
  parseMarkdownHeadings,
  resolveActiveMarkdownHeadingLine,
} from "./markdownEditorOutline";

export function CourseMarkdownEditorOutline({
  text,
  activeLine,
  onJumpToLine,
}: {
  text: string;
  /** 1-based cursor line for active heading highlight. */
  activeLine?: number;
  onJumpToLine: (line: number) => void;
}) {
  const headings = useMemo(() => parseMarkdownHeadings(text), [text]);
  const activeHeadingLine = useMemo(
    () =>
      activeLine != null ? resolveActiveMarkdownHeadingLine(headings, activeLine) : null,
    [activeLine, headings],
  );
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeHeadingLine]);

  const shellClass =
    "course-md-editor-outline flex w-[11rem] shrink-0 flex-col self-stretch border-r border-[var(--surface-border)] bg-[var(--surface-panel)]/40";

  if (headings.length === 0) {
    return (
      <aside className={shellClass}>
        <div className="border-b border-[var(--surface-border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Outline
        </div>
        <p className="px-2 py-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
          Headings appear here.
        </p>
      </aside>
    );
  }

  return (
    <aside className={shellClass}>
      <div className="border-b border-[var(--surface-border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Outline
      </div>
      <nav
        className="scrollbar-hide min-h-0 flex-1 overflow-y-auto py-1"
        aria-label="Document outline"
      >
        <ul className="flex flex-col gap-0.5 px-1">
          {headings.map((heading) => {
            const isActive = heading.line === activeHeadingLine;
            return (
              <li key={`${heading.line}-${heading.title}`}>
                <button
                  ref={isActive ? activeButtonRef : undefined}
                  type="button"
                  className={twMerge(
                    "w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-tight text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
                    isActive
                      ? "bg-[var(--surface-hover)] font-medium text-[var(--accent-amber)]"
                      : null,
                  )}
                  style={{ paddingLeft: `${(heading.level - 1) * 0.45 + 0.375}rem` }}
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => onJumpToLine(heading.line)}
                >
                  {heading.title}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
