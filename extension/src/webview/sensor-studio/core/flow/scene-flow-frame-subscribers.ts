import type { Node } from "@xyflow/react";
import type { StudioNodeData } from "../../features/editor/store/flow-editor.store";

/** 3D preview consumers — need graph eval at display refresh rate. */
export const SCENE_FRAME_PREVIEW_NODE_IDS: ReadonlySet<string> = new Set([
  "model-viewer",
  "rotation-3d-euler",
  "rotation-3d-quaternion",
]);

/** Scene wire producers merged into previews (env / cam / anim). */
export const SCENE_FRAME_WIRE_NODE_IDS: ReadonlySet<string> = new Set([
  "environment",
  "camera-view",
  "glb-animation-bundle",
  "object-transform",
  "transform-from-euler",
]);

/** Commits evaluated scene to the Stage pane (node-animator Scene Output parity). */
export const SCENE_FRAME_STAGE_NODE_IDS: ReadonlySet<string> = new Set(["scene-output"]);

/** Time-based sources — only advance when the graph is ticked (not UART-bound). */
export const SCENE_FRAME_TIME_SOURCE_NODE_IDS: ReadonlySet<string> = new Set([
  "sine-wave",
  "ramp-sim",
  "step-sim",
  "noise-sim",
  "scene-time",
  "frame-delta",
]);

/** Web Audio nodes — sweep, routing, and analyser refresh need rAF ticks without UART. */
export const SCENE_FRAME_AUDIO_NODE_IDS: ReadonlySet<string> = new Set([
  "mic-input",
  "audio-oscillator",
  "audio-sfx",
  "audio-machine",
  "audio-file-player",
  "audio-output",
  "audio-scope",
]);

/** Camera / video texture nodes — getUserMedia + VideoTexture lifecycle on rAF. */
export const SCENE_FRAME_CAMERA_NODE_IDS: ReadonlySet<string> = new Set([
  "camera-input",
  "video-texture",
]);

export function nodeIdNeedsSceneFrameTick(nodeId: string): boolean {
  return (
    SCENE_FRAME_PREVIEW_NODE_IDS.has(nodeId) ||
    SCENE_FRAME_WIRE_NODE_IDS.has(nodeId) ||
    SCENE_FRAME_TIME_SOURCE_NODE_IDS.has(nodeId) ||
    SCENE_FRAME_STAGE_NODE_IDS.has(nodeId)
  );
}

/** True when the canvas should run Domain B (rAF) ticks in addition to telemetry ticks. */
export function graphNeedsSceneFrameTick(nodes: ReadonlyArray<Node<StudioNodeData>>): boolean {
  return nodes.some((node) => nodeIdNeedsSceneFrameTick(node.data.nodeId));
}

export function graphNeedsAudioFrameTick(nodes: ReadonlyArray<Node<StudioNodeData>>): boolean {
  return nodes.some((node) => SCENE_FRAME_AUDIO_NODE_IDS.has(node.data.nodeId));
}

export function graphNeedsCameraFrameTick(nodes: ReadonlyArray<Node<StudioNodeData>>): boolean {
  return nodes.some((node) => SCENE_FRAME_CAMERA_NODE_IDS.has(node.data.nodeId));
}
