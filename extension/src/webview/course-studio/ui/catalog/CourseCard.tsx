export function CourseCard({ title, body }: { title?: string; body: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3">
      {title ? (
        <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
      ) : null}
      <p className={`text-sm leading-relaxed text-[var(--text-secondary)] ${title ? "mt-2" : ""}`}>
        {body}
      </p>
    </div>
  );
}
