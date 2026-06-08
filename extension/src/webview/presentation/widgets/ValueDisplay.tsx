import type { CSSProperties } from "react";

export function ValueDisplay({
  label,
  value,
  unit,
  color = "var(--accent-cyan)",
  decimals = 3,
  className = "",
}: {
  label: string;
  value: number;
  unit: string;
  color?: string;
  decimals?: number;
  className?: string;
}) {
  const formatted = Number.isFinite(value) ? value.toFixed(decimals) : "—";
  const style: CSSProperties = { color };

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-2xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold leading-none" style={style}>
          {formatted}
        </span>
        <span className="text-sm text-[var(--text-muted)]">{unit}</span>
      </div>
    </div>
  );
}
