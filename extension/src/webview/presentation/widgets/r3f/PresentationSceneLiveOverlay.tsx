import type { ReactNode } from "react";

export type PresentationSceneParam = {
  label: string;
  value: number;
  decimals?: number;
  color?: string;
  unit?: string;
};

export function PresentationSceneParamRow({
  label,
  value,
  decimals = 4,
  color = "var(--accent-purple)",
  unit = "",
}: PresentationSceneParam) {
  const formatted = Number.isFinite(value) ? value.toFixed(decimals) : "—";

  return (
    <div className="presentation-scene-param-chip">
      <span className="presentation-scene-param-chip__label">{label}</span>
      <span className="presentation-scene-param-chip__value" style={{ color }}>
        {formatted}
        {unit && formatted !== "—" ? (
          <span className="presentation-scene-param-chip__unit"> {unit}</span>
        ) : null}
      </span>
    </div>
  );
}

/** HUD panel over a presentation 3D scene — pointer-events none so orbit still works. */
export function PresentationSceneLiveOverlay({
  title,
  children,
  position = "top-left",
}: {
  title?: string;
  children: ReactNode;
  position?: "top-left" | "bottom-left";
}) {
  return (
    <div className={`presentation-scene-live-overlay presentation-scene-live-overlay--${position}`}>
      {title ? <div className="presentation-scene-live-overlay__title">{title}</div> : null}
      {children}
    </div>
  );
}
