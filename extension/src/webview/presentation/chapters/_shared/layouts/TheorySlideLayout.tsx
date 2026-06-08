import type { ReactNode } from "react";
import { SlidePage } from "../../../layout/SlidePage";
import type { SlideLayoutId } from "../../../layout/slide-layout.types";
import { PresentationVisualPanel, type VisualPanelAccent } from "../visual/PresentationVisualPanel";

export function TheorySlideLayout({
  eyebrow,
  title,
  subtitle,
  children,
  centered = false,
  visual,
  visualLabel = "Diagram",
  visualAccent = "cyan",
  footer,
  layout,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  centered?: boolean;
  visual?: ReactNode;
  visualLabel?: string;
  visualAccent?: VisualPanelAccent;
  footer?: ReactNode;
  layout?: SlideLayoutId;
}) {
  const resolvedLayout: SlideLayoutId = layout ?? (visual ? "split-50" : centered ? "full-center" : "stack");

  const heading = { eyebrow, title, subtitle, accent: visualAccent };

  const visualPanel = visual ? (
    <PresentationVisualPanel label={visualLabel} accent={visualAccent} className="h-full min-h-[240px]">
      {visual}
    </PresentationVisualPanel>
  ) : undefined;

  return (
    <SlidePage
      layout={resolvedLayout}
      heading={heading}
      footer={footer}
      main={children}
      visual={visualPanel}
    />
  );
}
