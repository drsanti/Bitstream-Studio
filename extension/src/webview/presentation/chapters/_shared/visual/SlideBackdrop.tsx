import type { ReactNode } from "react";

export type SlideBackdropAccent = "cyan" | "amber" | "purple" | "green";

const ACCENT_VARS: Record<SlideBackdropAccent, { primary: string; secondary: string }> = {
  cyan: { primary: "var(--accent-cyan)", secondary: "var(--accent-purple)" },
  amber: { primary: "var(--accent-amber)", secondary: "var(--accent-cyan)" },
  purple: { primary: "var(--accent-purple)", secondary: "var(--accent-cyan)" },
  green: { primary: "var(--accent-green)", secondary: "var(--accent-cyan)" },
};

export function SlideBackdrop({
  accent = "cyan",
  children,
}: {
  accent?: SlideBackdropAccent;
  children: ReactNode;
}) {
  const vars = ACCENT_VARS[accent];

  return (
    <div
      className="presentation-slide-backdrop"
      style={
        {
          "--backdrop-accent": vars.primary,
          "--backdrop-accent-secondary": vars.secondary,
        } as React.CSSProperties
      }
    >
      <div className="presentation-slide-backdrop__grid" />
      <div className="presentation-slide-backdrop__mesh presentation-slide-backdrop__mesh--a" />
      <div className="presentation-slide-backdrop__mesh presentation-slide-backdrop__mesh--b" />
      <div className="presentation-slide-backdrop__vignette" />
      <div className="presentation-slide-content">{children}</div>
    </div>
  );
}
