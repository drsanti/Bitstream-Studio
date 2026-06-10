export function CourseCodeCard({
  language,
  code,
  caption,
}: {
  language: string;
  code: string;
  caption?: string;
}) {
  return (
    <figure className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--surface-border)] px-3 py-1.5">
        <span className="text-2xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {language}
        </span>
      </div>
      <pre className="scrollbar-hide min-h-0 flex-1 overflow-auto bg-zinc-950/50 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
      {caption != null && caption.length > 0 ? (
        <figcaption className="shrink-0 border-t border-[var(--surface-border)] px-3 py-2 text-2xs text-[var(--text-secondary)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
