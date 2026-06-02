import type { HTMLAttributes, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export type FlowNodeSocketRegionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /**
   * When true, children output rows use subgrid so port labels share one column
   * sized to the widest label (live sensor source nodes).
   */
  alignedOutputColumns?: boolean;
  /**
   * When true, measures the widest label in this region and applies the width to all labels.
   * Used for input sockets so label and value columns align perfectly.
   */
  equalizeLabelWidth?: boolean;
};

export function FlowNodeSocketRegion(props: FlowNodeSocketRegionProps) {
  const { children, className, alignedOutputColumns = false, equalizeLabelWidth = false, ...rest } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [labelWidthPx, setLabelWidthPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!equalizeLabelWidth) {
      setLabelWidthPx(null);
      return;
    }
    const el = rootRef.current;
    if (!el) {
      return;
    }

    const measure = () => {
      const labels = el.querySelectorAll<HTMLElement>("[data-flow-socket-label]");
      let max = 0;
      labels.forEach((node) => {
        // Use intrinsic content width (ignores applied width constraints).
        const w = node.scrollWidth;
        if (w > max) max = w;
      });
      // Safety clamp: socket labels should never be enormous.
      const rounded = max > 0 ? Math.ceil(max) : 0;
      const clamped = rounded > 0 ? Math.min(240, rounded) : 0;
      setLabelWidthPx((prev) => (prev === clamped ? prev : clamped));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [equalizeLabelWidth, children]);

  return (
    <div
      ref={rootRef}
      className={twMerge(
        "nodrag min-w-0 w-full max-w-full overflow-visible",
        alignedOutputColumns
          ? "grid grid-cols-[minmax(0,1fr)_max-content_0] gap-x-0 gap-y-0.5"
          : "flex flex-col gap-0.5",
        className,
      )}
      style={{
        ...(rest.style ?? {}),
        ...(labelWidthPx != null && labelWidthPx > 0
          ? { ["--flow-socket-label-w" as any]: `${labelWidthPx}px` }
          : null),
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
