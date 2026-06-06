import { isAudioScopeNodeId } from "../audio/audio-scope-config";
import { isPlotterNodeId } from "../plotter/plotter-config";

/** Resizable flow nodes whose body is a flex-filled 2D plot canvas (Plotter, Audio Scope). */
export function isStudioFlexPlotCanvasNodeId(nodeId: string): boolean {
  return isPlotterNodeId(nodeId) || isAudioScopeNodeId(nodeId);
}
