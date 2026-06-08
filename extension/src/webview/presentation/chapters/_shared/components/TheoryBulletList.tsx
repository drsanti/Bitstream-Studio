import type { ReactNode } from "react";

export function TheoryBulletList({
  items,
  accent = "var(--accent-cyan)",
}: {
  items: ReactNode[];
  accent?: string;
}) {
  return (
    <ul className="flex max-w-2xl flex-col gap-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-secondary)]"
        >
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
