import type { FlowCanvasEdgeSelectionHighlight } from "../../../persistence/flow-canvas-preferences";

const SELECTION_STYLE: Record<
  FlowCanvasEdgeSelectionHighlight,
  { strokeWidthBoost: number; glowBlurPx: number; glowOpacity: number }
> = {
  subtle: { strokeWidthBoost: 0.75, glowBlurPx: 4, glowOpacity: 0.45 },
  normal: { strokeWidthBoost: 1.25, glowBlurPx: 7, glowOpacity: 0.72 },
  strong: { strokeWidthBoost: 1.75, glowBlurPx: 10, glowOpacity: 0.95 },
};

/** Port-tinted glow + extra stroke for selected wires. */
export function edgeSelectionAdjustments(
  stroke: string,
  level: FlowCanvasEdgeSelectionHighlight,
): { strokeWidthBoost: number; filter: string } {
  const spec = SELECTION_STYLE[level];
  const filter = `drop-shadow(0 0 ${spec.glowBlurPx}px ${stroke}) drop-shadow(0 0 ${Math.round(spec.glowBlurPx * 0.55)}px rgba(255,255,255,${spec.glowOpacity}))`;
  return {
    strokeWidthBoost: spec.strokeWidthBoost,
    filter,
  };
}
