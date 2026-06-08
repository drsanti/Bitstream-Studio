import type { ReactNode } from "react";
import { SlidePage } from "../../../layout/SlidePage";
import type { SlideLayoutId } from "../../../layout/slide-layout.types";

export function DemoSlideLayout({
  title,
  subtitle,
  theoryStrip,
  children,
  footer,
  scene,
  layout = "stack",
}: {
  title: string;
  subtitle?: string;
  theoryStrip?: string;
  children: ReactNode;
  footer?: ReactNode;
  scene?: ReactNode;
  layout?: Extract<SlideLayoutId, "stack" | "demo-rail" | "split-50" | "grid-2x2" | "grid-2x3">;
}) {
  const heading = {
    eyebrow: "Demo",
    title,
    subtitle,
    accent: "amber" as const,
  };

  const main = (
    <>
      {theoryStrip ? (
        <p
          className="shrink-0 rounded-lg border px-4 py-2 text-sm text-[var(--text-secondary)]"
          style={{
            borderColor: "color-mix(in srgb, var(--accent-amber) 30%, transparent)",
            background: "var(--accent-amber-bg)",
          }}
        >
          {theoryStrip}
        </p>
      ) : null}
      {children}
    </>
  );

  return (
    <SlidePage layout={layout} heading={heading} footer={footer} main={main} scene={scene} />
  );
}
