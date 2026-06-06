/** Wire-level vec3 / quaternion used across flow graph and BMI270 bundles. */
export type FlowWireVec3 = { x: number; y: number; z: number };

export type FlowWireQuaternion = { x: number; y: number; z: number; w: number };

/** Lightweight reference for v0.2 audio routing (not raw PCM buffers). */
export type FlowWireAudioBusV1 = {
  kind: "audioBus";
  /** Flow node id of the audio source (mic / oscillator / file player). */
  sourceNodeId: string;
};

export type { FlowWireVideoBusV1, FlowWireVideoTextureV1 } from "../camera/flow-wire-video";
