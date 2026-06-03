/** Last Stage viewport pick surfaced on **on-stage-pick** nodes (Domain C). */
export type FlowWireStagePickV1 = {
  kind: "stagePick";
  version: 1;
  modelIndex: number;
  sourceNodeId: string;
  hitPoint: { x: number; y: number; z: number };
  /** Object name path under the picked model root (slash-separated). */
  objectPath: string;
  firedAtMs: number;
};

export function flowWireStagePickFromDetail(
  detail: Omit<FlowWireStagePickV1, "kind" | "version">,
): FlowWireStagePickV1 {
  return {
    kind: "stagePick",
    version: 1,
    ...detail,
  };
}

export function isFlowWireStagePickV1(v: unknown): v is FlowWireStagePickV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWireStagePickV1).kind === "stagePick" &&
    (v as FlowWireStagePickV1).version === 1
  );
}
