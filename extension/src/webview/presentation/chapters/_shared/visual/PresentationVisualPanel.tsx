import type { ReactNode } from "react";

export type VisualPanelAccent = "cyan" | "amber" | "purple" | "green" | "red";

const ACCENT_MAP: Record<VisualPanelAccent, string> = {
  cyan: "var(--accent-cyan)",
  amber: "var(--accent-amber)",
  purple: "var(--accent-purple)",
  green: "var(--accent-green)",
  red: "var(--accent-red)",
};

export function PresentationVisualPanel({
  label,
  accent = "cyan",
  children,
  className = "",
}: {
  label?: string;
  accent?: VisualPanelAccent;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`presentation-visual-panel ${className}`}
      style={{ "--panel-accent": ACCENT_MAP[accent] } as React.CSSProperties}
    >
      {label ? <div className="presentation-visual-panel__label">{label}</div> : null}
      <div className="presentation-visual-panel__body">{children}</div>
    </div>
  );
}
