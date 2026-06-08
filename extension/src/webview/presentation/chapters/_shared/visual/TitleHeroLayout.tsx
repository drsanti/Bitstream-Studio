import type { ReactNode } from "react";
import { SlidePage } from "../../../layout/SlidePage";
import type { SlideBackdropAccent } from "./SlideBackdrop";
import { PresentationVisualPanel, type VisualPanelAccent } from "./PresentationVisualPanel";

export function TitleHeroLayout({
  eyebrow,
  badge,
  title,
  subtitle,
  icon,
  visual,
  accent = "cyan",
  footer,
}: {
  eyebrow?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  visual?: ReactNode;
  accent?: SlideBackdropAccent;
  footer?: ReactNode;
}) {
  const panelAccent = accent as VisualPanelAccent;

  return (
    <SlidePage
      layout="hero-title"
      heading={{ eyebrow, title, subtitle, badge, accent }}
      footer={footer}
      main={icon}
      visual={
        visual ? (
          <PresentationVisualPanel label="Overview" accent={panelAccent} className="h-full">
            {visual}
          </PresentationVisualPanel>
        ) : undefined
      }
    />
  );
}
