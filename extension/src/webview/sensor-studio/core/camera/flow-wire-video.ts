/** Lightweight video stream reference on flow wires (not raw MediaStream / frames). */
export type FlowWireVideoBusV1 = {
  kind: "videoBus";
  /** Flow node id of the **`camera-input`** source. */
  sourceNodeId: string;
};

/** Runtime texture handle produced by **`video-texture`**. */
export type FlowWireVideoTextureV1 = {
  kind: "videoTexture";
  /** Flow node id of the **`video-texture`** producer. */
  sourceNodeId: string;
  /** Upstream **`camera-input`** node id. */
  cameraNodeId: string;
};

export function makeFlowWireVideoBusV1(sourceNodeId: string): FlowWireVideoBusV1 {
  return { kind: "videoBus", sourceNodeId };
}

export function makeFlowWireVideoTextureV1(args: {
  sourceNodeId: string;
  cameraNodeId: string;
}): FlowWireVideoTextureV1 {
  return {
    kind: "videoTexture",
    sourceNodeId: args.sourceNodeId,
    cameraNodeId: args.cameraNodeId,
  };
}

export function isFlowWireVideoBusV1(v: unknown): v is FlowWireVideoBusV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWireVideoBusV1).kind === "videoBus" &&
    typeof (v as FlowWireVideoBusV1).sourceNodeId === "string" &&
    (v as FlowWireVideoBusV1).sourceNodeId.length > 0
  );
}

export function isFlowWireVideoTextureV1(v: unknown): v is FlowWireVideoTextureV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWireVideoTextureV1).kind === "videoTexture" &&
    typeof (v as FlowWireVideoTextureV1).sourceNodeId === "string" &&
    typeof (v as FlowWireVideoTextureV1).cameraNodeId === "string"
  );
}

export function coerceFlowWireVideoBusV1(v: unknown): FlowWireVideoBusV1 | null {
  return isFlowWireVideoBusV1(v) ? v : null;
}
