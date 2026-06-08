import type { ReactNode } from "react";

export function LabSlideLayout({
  title,
  objective,
  steps,
  children,
  footer,
}: {
  title: string;
  objective: string;
  steps: string[];
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-6 px-16 py-10">
      <div className="shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-purple)]">
          Lab
        </p>
        <h2 className="mt-2 text-4xl font-extrabold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">{objective}</p>
      </div>

      <ol className="flex max-w-2xl shrink-0 flex-col gap-2">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex items-start gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-2.5 text-sm text-[var(--text-secondary)]"
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-bold text-[var(--text-inverse)]"
              style={{ background: "var(--accent-purple)" }}
            >
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {children ? <div className="min-h-0 flex-1">{children}</div> : null}

      {footer ? <div className="shrink-0 text-2xs text-[var(--text-muted)]">{footer}</div> : null}
    </div>
  );
}
