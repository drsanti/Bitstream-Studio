import type { SlideHeadingSpec } from "./slide-layout.types";

const ACCENT_CLASS: Record<NonNullable<SlideHeadingSpec["accent"]>, string> = {
  cyan: "text-[var(--accent-cyan)]",
  amber: "text-[var(--accent-amber)]",
  purple: "text-[var(--accent-purple)]",
  green: "text-[var(--accent-green)]",
};

export function SlideHeading({ eyebrow, title, subtitle, badge, accent = "cyan" }: SlideHeadingSpec) {
  const accentColor = ACCENT_CLASS[accent];

  return (
    <header className="presentation-slide-heading shrink-0">
      {eyebrow ? (
        <p className={`text-xs font-semibold uppercase tracking-widest ${accentColor}`}>{eyebrow}</p>
      ) : null}
      {badge ? (
        <span
          className="mt-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
          style={{
            color: `var(--accent-${accent})`,
            borderColor: `color-mix(in srgb, var(--accent-${accent}) 40%, transparent)`,
            background: `var(--accent-${accent}-bg)`,
          }}
        >
          {badge}
        </span>
      ) : null}
      <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">{title}</h2>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>
      ) : null}
    </header>
  );
}
