import type { RefObject } from "react";
import { dispatchFlowKeyboardEventFromDom } from "../../../app/flow-event-dispatch";
import type { FlowCanvasGraphHandle } from "../components/flow-canvas-graph-handle";
import { resolveSelectedNodeGroupSubgraphId } from "../subgraphs/resolve-selected-node-group";
import {
  useFlowEditorStore,
  type StudioDemoTemplateId,
} from "../store/flow-editor.store";
import { isFlowKeyboardTarget } from "./is-flow-keyboard-target";

export type FlowKeyboardShortcutActions = {
  clearNodeSelection: () => void;
  selectAllNodes: () => void;
  toggleSelectAllNodes: () => void;
  duplicateSelection: () => void;
  copyFlowSelectionToClipboard: () => Promise<boolean>;
  pasteFlowFromClipboard: () => Promise<{
    ok: boolean;
    message?: string;
    pendingFlowPreset?: unknown;
    pendingRawFlowDocument?: string;
  }>;
  createGroupFromSelection: () => void;
  ungroupSelection: () => void;
  enterGroup: (groupId: string) => void;
  exitGroup: () => void;
  undo: () => void;
  redo: () => void;
  muteAllAudio: () => void;
  clearNow: () => void;
  runTemplateNow: () => void;
  runSpecificTemplate: (templateId: StudioDemoTemplateId) => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
  requestFitView: () => void;
  resetSelectionStudioNodesToDefaults: () => void;
  fitSelectionStudioNodesWidth: () => void;
  setTemplateId: (templateId: StudioDemoTemplateId) => void;
};

export type FlowKeyboardShortcutContext = FlowKeyboardShortcutActions & {
  flowCanvasGraphRef: RefObject<FlowCanvasGraphHandle | null>;
};

/** Returns true when the shortcut was handled (caller should preventDefault). */
export function handleFlowKeyboardShortcut(
  event: KeyboardEvent,
  ctx: FlowKeyboardShortcutContext,
): boolean {
  if (isFlowKeyboardTarget(event.target)) {
    return false;
  }

  const key = event.key;
  const mod = event.ctrlKey || event.metaKey;

  if (key === "Escape") {
    if (ctx.flowCanvasGraphRef.current?.isAddNodeMenuOpen()) {
      ctx.flowCanvasGraphRef.current.closeAddNodeMenu();
      return true;
    }
    ctx.clearNodeSelection();
    return true;
  }

  if (!mod && !event.shiftKey && !event.altKey && (key === "a" || key === "A")) {
    ctx.toggleSelectAllNodes();
    return true;
  }

  if (
    event.shiftKey &&
    !mod &&
    !event.altKey &&
    (key === "a" || key === "A")
  ) {
    ctx.flowCanvasGraphRef.current?.toggleAddNodeMenu();
    return true;
  }

  if (event.shiftKey && !mod && !event.altKey && (key === "r" || key === "R")) {
    ctx.resetSelectionStudioNodesToDefaults();
    return true;
  }

  if (event.shiftKey && !mod && !event.altKey && (key === "w" || key === "W")) {
    ctx.fitSelectionStudioNodesWidth();
    return true;
  }

  if (mod && !event.shiftKey && (key === "a" || key === "A")) {
    ctx.selectAllNodes();
    return true;
  }

  if (mod && !event.shiftKey && (key === "d" || key === "D")) {
    ctx.duplicateSelection();
    return true;
  }

  if (mod && !event.shiftKey && (key === "c" || key === "C")) {
    void ctx.copyFlowSelectionToClipboard();
    return true;
  }

  if (mod && !event.shiftKey && (key === "v" || key === "V")) {
    void ctx.pasteFlowFromClipboard();
    return true;
  }

  if (mod && !event.shiftKey && (key === "g" || key === "G")) {
    ctx.createGroupFromSelection();
    return true;
  }

  if (mod && event.shiftKey && (key === "g" || key === "G")) {
    ctx.ungroupSelection();
    return true;
  }

  if (key === "Tab" && !mod && !event.altKey) {
    if (event.shiftKey) {
      ctx.exitGroup();
      return true;
    }
    const flowState = useFlowEditorStore.getState();
    const selectedGroupId =
      ctx.flowCanvasGraphRef.current?.getSelectedNodeGroupId?.() ??
      resolveSelectedNodeGroupSubgraphId({
        renderNodes: [],
        storeNodes: flowState.nodes,
        selectedNodeIds: flowState.selectedNodeIds,
        selectedNodeId: flowState.selectedNodeId,
      });
    if (selectedGroupId != null) {
      ctx.enterGroup(selectedGroupId);
      return true;
    }
  }

  if (mod && event.shiftKey && (key === "f" || key === "F")) {
    ctx.requestFitView();
    return true;
  }

  if (mod && event.shiftKey && key === "1") {
    ctx.runSpecificTemplate("basic-indicator");
    return true;
  }

  if (mod && event.shiftKey && key === "2") {
    ctx.runSpecificTemplate("gauge-monitor");
    return true;
  }

  if (mod && event.shiftKey && key === "3") {
    ctx.runSpecificTemplate("signal-chain");
    return true;
  }

  if (mod && event.shiftKey && key === "4") {
    ctx.runSpecificTemplate("bmi270-gauge-z");
    return true;
  }

  if (mod && event.shiftKey && (key === "e" || key === "E")) {
    ctx.onExportFlow();
    return true;
  }

  if (mod && event.shiftKey && (key === "i" || key === "I")) {
    ctx.onImportFlowPick();
    return true;
  }

  if (mod && !event.altKey && !event.shiftKey && key.toLowerCase() === "z") {
    ctx.undo();
    return true;
  }

  if (mod && !event.altKey && event.shiftKey && key.toLowerCase() === "z") {
    ctx.redo();
    return true;
  }

  if (mod && (key === "y" || key === "Y")) {
    ctx.redo();
    return true;
  }

  if (!mod && !event.altKey && !event.shiftKey && (key === "m" || key === "M")) {
    ctx.muteAllAudio();
    return true;
  }

  if (mod && !event.shiftKey && key === "1") {
    ctx.runTemplateNow();
    return true;
  }

  if (mod && key === "Backspace") {
    ctx.clearNow();
    return true;
  }

  if (mod && key === "2") {
    ctx.setTemplateId("gauge-monitor");
    return true;
  }

  if (mod && key === "3") {
    ctx.setTemplateId("signal-chain");
    return true;
  }

  if (mod && key === "4") {
    ctx.setTemplateId("basic-indicator");
    return true;
  }

  if (mod && key === "5") {
    ctx.setTemplateId("bmi270-gauge-z");
    return true;
  }

  if (dispatchFlowKeyboardEventFromDom(event)) {
    return true;
  }

  return false;
}
