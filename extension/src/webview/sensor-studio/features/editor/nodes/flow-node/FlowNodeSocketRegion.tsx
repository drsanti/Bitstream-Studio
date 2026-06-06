import type { HTMLAttributes, CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  measureFlowNodeSocketLabelIntrinsicWidth,
  measureFlowNodeSocketPreviewIntrinsicWidth,
} from "./flow-node-intrinsic-size";

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
  /** When false, drop the live-preview grid column (label + handle only). */
  showLivePreviewColumn?: boolean;
  /** Flex layout: pack socket rows to the trailing edge (output pins). */
  alignRowsToEnd?: boolean;
};

type LiveColumnWidths = { preview: number; label: number };

/** Output handle column sits on shell edge — see `flow-node-handles.css`. */
const ALIGNED_OUTPUT_LIVE_GRID_COLS = (labelW: number) =>
  `minmax(0, 1fr) ${labelW}px 0px`;

const ALIGNED_OUTPUT_LABEL_ONLY_GRID_COLS = "minmax(0, 1fr) max-content 0px";

export function FlowNodeSocketRegion(props: FlowNodeSocketRegionProps) {
  const {
    children,
    className,
    alignedOutputColumns = false,
    equalizeLabelWidth = false,
    showLivePreviewColumn = true,
    alignRowsToEnd = false,
    style,
    ...rest
  } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [labelWidthPx, setLabelWidthPx] = useState<number | null>(null);
  const [liveColumnWidths, setLiveColumnWidths] = useState<LiveColumnWidths | null>(
    null,
  );

  const alignedOutputLiveGrid =
    alignedOutputColumns && showLivePreviewColumn && equalizeLabelWidth;

  const alignedOutputLabelOnlyGrid =
    alignedOutputColumns && !showLivePreviewColumn;

  useLayoutEffect(() => {
    if (!equalizeLabelWidth) {
      setLabelWidthPx(null);
      setLiveColumnWidths(null);
      return;
    }
    const el = rootRef.current;
    if (!el) {
      return;
    }

    const measure = () => {
      const labels = el.querySelectorAll<HTMLElement>("[data-flow-socket-label]");
      let maxLabel = 0;
      labels.forEach((node) => {
        const w = measureFlowNodeSocketLabelIntrinsicWidth(node);
        if (w > maxLabel) maxLabel = w;
      });
      const roundedLabel = maxLabel > 0 ? Math.ceil(maxLabel) : 0;
      const clampedLabel =
        roundedLabel > 0 ? Math.min(240, roundedLabel) : 0;

      if (alignedOutputLiveGrid) {
        const previews = el.querySelectorAll<HTMLElement>(
          "[data-flow-socket-live-preview]",
        );
        let maxPreview = 0;
        previews.forEach((node) => {
          const w = measureFlowNodeSocketPreviewIntrinsicWidth(node);
          if (w > maxPreview) maxPreview = w;
        });
        const roundedPreview = maxPreview > 0 ? Math.ceil(maxPreview) : 0;
        setLiveColumnWidths((prev) => {
          const next =
            roundedPreview > 0 && clampedLabel > 0
              ? { preview: roundedPreview, label: clampedLabel }
              : null;
          if (
            prev?.preview === next?.preview &&
            prev?.label === next?.label
          ) {
            return prev;
          }
          return next;
        });
        setLabelWidthPx(null);
        return;
      }

      setLiveColumnWidths(null);
      setLabelWidthPx((prev) => (prev === clampedLabel ? prev : clampedLabel));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    equalizeLabelWidth,
    alignedOutputLiveGrid,
    children,
    showLivePreviewColumn,
  ]);

  const alignedGridStyle: CSSProperties | undefined = alignedOutputLiveGrid
    ? {
        gridTemplateColumns:
          liveColumnWidths != null
            ? ALIGNED_OUTPUT_LIVE_GRID_COLS(liveColumnWidths.label)
            : "minmax(0, 1fr) max-content 0px",
        ...(liveColumnWidths != null && liveColumnWidths.preview > 0
          ? {
              ["--flow-socket-preview-min-w" as string]: `${liveColumnWidths.preview}px`,
            }
          : null),
      }
    : alignedOutputLabelOnlyGrid
      ? { gridTemplateColumns: ALIGNED_OUTPUT_LABEL_ONLY_GRID_COLS }
      : undefined;

  return (
    <div
      ref={rootRef}
      className={twMerge(
        "nodrag min-w-0 w-full max-w-full overflow-visible",
        alignedOutputLiveGrid || alignedOutputLabelOnlyGrid
          ? "grid w-full gap-x-2 gap-y-0.5"
          : twMerge(
              "flex flex-col gap-0.5",
              alignRowsToEnd ? "items-end" : null,
            ),
        className,
      )}
      style={{
        ...(style ?? {}),
        ...(alignedGridStyle ?? {}),
        ...(labelWidthPx != null &&
        labelWidthPx > 0 &&
        !alignedOutputLiveGrid &&
        !alignedOutputLabelOnlyGrid
          ? { ["--flow-socket-label-w" as string]: `${labelWidthPx}px` }
          : null),
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
