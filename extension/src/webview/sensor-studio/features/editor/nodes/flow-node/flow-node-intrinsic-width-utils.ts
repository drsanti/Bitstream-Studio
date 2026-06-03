/** Shared layout tokens for flow node body min-width measurement. */
export const FLOW_NODE_BODY_PANEL_CLASS =
  "relative min-w-0 w-full max-w-full overflow-hidden";

/** `FlowNodeBody` horizontal padding (`px-2` × 2). */
export const FLOW_NODE_BODY_HORIZONTAL_PADDING_PX = 16;

/** `ReadingPanel` / body panel with `px-2.5` × 2. */
export const FLOW_NODE_BODY_PANEL_PADDING_PX = 20;

/** TRNSelect trigger: leading icon + chevron + gaps (approx.). */
export const FLOW_NODE_TRN_SELECT_TRIGGER_CHROME_PX = 44;

export function widestDisplayLabel(candidates: readonly string[]): string {
  let widest = "";
  for (const raw of candidates) {
    const t = raw.trim();
    if (t.length > widest.length) {
      widest = t;
    }
  }
  return widest;
}

export function widestTrnSelectOptionLabel(
  options: readonly { label: string }[],
): string {
  return widestDisplayLabel(options.map((o) => o.label));
}
