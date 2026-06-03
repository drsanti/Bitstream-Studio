import { widestDisplayLabel } from "./flow-node-intrinsic-width-utils";

export type FlowNodeIntrinsicWidthMarkerProps = {
  /** One or more candidate strings — uses the longest after trim. */
  labels: readonly string[];
};

/**
 * Off-DOM width probe for {@link measureFlowNodeBodyIntrinsicWidth}.
 * Parent must use {@link FLOW_NODE_BODY_PANEL_CLASS} or sit inside the body measure root.
 */
export function FlowNodeIntrinsicWidthMarker(props: FlowNodeIntrinsicWidthMarkerProps) {
  const text = widestDisplayLabel(props.labels);
  if (text.length === 0) {
    return null;
  }
  return (
    <span
      data-flow-node-intrinsic-width
      className="pointer-events-none absolute -z-10 w-max whitespace-nowrap opacity-0"
      aria-hidden
    >
      {text}
    </span>
  );
}
