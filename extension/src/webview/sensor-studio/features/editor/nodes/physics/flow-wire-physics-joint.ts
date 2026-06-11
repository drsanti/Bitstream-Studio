/** Joint constraint on **`physicsJoint`** wires (fixed-joint / hinge-joint → physics-world). */
export type FlowWirePhysicsJointV1 = {
  kindWire: "physicsJoint";
  version: 1;
  sourceNodeId: string;
  label: string;
  jointKind: "fixed" | "hinge";
  bodyASourceNodeId: string;
  bodyBSourceNodeId: string;
  /** Revolute axis for hinge joints. */
  axis: "x" | "y" | "z";
};

export function flowWirePhysicsJointFromEval(args: {
  sourceNodeId: string;
  label: string;
  jointKind: "fixed" | "hinge";
  bodyA: { sourceNodeId: string };
  bodyB: { sourceNodeId: string };
  axis?: "x" | "y" | "z";
}): FlowWirePhysicsJointV1 {
  return {
    kindWire: "physicsJoint",
    version: 1,
    sourceNodeId: args.sourceNodeId,
    label: args.label,
    jointKind: args.jointKind,
    bodyASourceNodeId: args.bodyA.sourceNodeId,
    bodyBSourceNodeId: args.bodyB.sourceNodeId,
    axis: args.axis ?? "y",
  };
}

export function isFlowWirePhysicsJointV1(v: unknown): v is FlowWirePhysicsJointV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWirePhysicsJointV1).kindWire === "physicsJoint" &&
    (v as FlowWirePhysicsJointV1).version === 1
  );
}
