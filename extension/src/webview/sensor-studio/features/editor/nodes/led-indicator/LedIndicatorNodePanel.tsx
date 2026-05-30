/** LED indicator node panel — HTML/CSS (no canvas needed). */

type LedConfig = {
  label: string;
  onColor: string;
  offColor: string;
  threshold: number;
  blink: boolean;
};

function coerceConfig(dc: Record<string, unknown>): LedConfig {
  return {
    label: typeof dc.label === "string" ? dc.label : "LED",
    onColor: typeof dc.onColor === "string" ? dc.onColor : "#22c55e",
    offColor: typeof dc.offColor === "string" ? dc.offColor : "#18181b",
    threshold: typeof dc.threshold === "number" ? dc.threshold : 0.5,
    blink: dc.blink === true,
  };
}

function isOn(value: number | boolean | string | null | undefined, threshold: number): boolean {
  if (value == null) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value >= threshold;
  if (typeof value === "string") return value === "true" || value === "1";
  return false;
}

type Props = {
  value: number | boolean | string | null | undefined;
  defaultConfig: Record<string, unknown>;
};

export function LedIndicatorNodePanel({ value, defaultConfig }: Props) {
  const cfg = coerceConfig(defaultConfig);
  const on = isOn(value, cfg.threshold);

  return (
    <div className="nodrag flex items-center gap-2.5 px-3 py-2.5">
      {/* LED bulb */}
      <div className="relative shrink-0">
        {/* outer glow */}
        {on && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 10px 4px ${cfg.onColor}55`,
              borderRadius: "50%",
            }}
          />
        )}
        {/* body */}
        <div
          className={`h-5 w-5 rounded-full border transition-all duration-150 ${
            cfg.blink && on ? "animate-pulse" : ""
          }`}
          style={{
            backgroundColor: on ? cfg.onColor : cfg.offColor,
            borderColor: on ? cfg.onColor + "88" : "rgba(63,63,70,0.8)",
            boxShadow: on
              ? `0 0 6px 2px ${cfg.onColor}66, inset 0 1px 3px rgba(255,255,255,0.25)`
              : "inset 0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          {/* specular highlight */}
          {on && (
            <div
              className="absolute rounded-full"
              style={{
                top: "15%",
                left: "18%",
                width: "30%",
                height: "28%",
                background: "rgba(255,255,255,0.55)",
                filter: "blur(1px)",
              }}
            />
          )}
        </div>
      </div>

      {/* Label + state text */}
      <div className="flex min-w-0 flex-col gap-0.5">
        {cfg.label.length > 0 && (
          <span className="truncate text-[9px] font-medium uppercase tracking-widest text-zinc-500">
            {cfg.label}
          </span>
        )}
        <span
          className="text-xs font-semibold transition-colors duration-150"
          style={{ color: on ? cfg.onColor : "rgba(113,113,122,0.9)" }}
        >
          {on ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
