interface LiveBarProps {
  value: number;
  min?: number;
  max?: number;
  color?: string;
  bgColor?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
  unit?: string;
  decimals?: number;
  className?: string;
}

export function LiveBar({
  value,
  min = -1,
  max = 1,
  color = "var(--accent-cyan)",
  bgColor = "var(--surface-border)",
  height = 8,
  label,
  showValue = false,
  unit = "",
  decimals = 2,
  className = "",
}: LiveBarProps) {
  const range = max - min;
  const clamped = Math.max(min, Math.min(max, value));
  const zeroFrac = (0 - min) / range;
  const valueFrac = (clamped - min) / range;
  const left = Math.min(zeroFrac, valueFrac) * 100;
  const width = Math.abs(valueFrac - zeroFrac) * 100;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label ? (
            <span className="text-2xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {label}
            </span>
          ) : null}
          {showValue ? (
            <span className="text-xs" style={{ color }}>
              {clamped.toFixed(decimals)} {unit}
            </span>
          ) : null}
        </div>
      )}
      <div className="relative w-full overflow-hidden rounded-full" style={{ height, background: bgColor }}>
        <div
          className="absolute bottom-0 top-0 w-px"
          style={{ left: `${zeroFrac * 100}%`, background: "var(--surface-hover)" }}
        />
        <div
          className="absolute bottom-0 top-0 rounded-full transition-all duration-75"
          style={{ left: `${left}%`, width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}
