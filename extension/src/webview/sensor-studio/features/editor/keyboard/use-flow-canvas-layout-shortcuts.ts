import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect, type RefObject } from "react";
import type { FlowGraphNode } from "../store/flow-editor.store";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { isFlowKeyboardTarget } from "./is-flow-keyboard-target";

/** Canvas-local **R** → reroute (uses React Flow instance ref; must not call `useReactFlow` outside `<ReactFlow>`). */
export function useFlowCanvasLayoutShortcuts(
  lastPointerRef: RefObject<{ clientX: number; clientY: number } | null>,
  reactFlowRef: RefObject<ReactFlowInstance<FlowGraphNode> | null>,
): void {
  const spawnRerouteAt = useFlowEditorStore((s) => s.spawnRerouteAt);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "r" || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }
      if (isFlowKeyboardTarget(event.target)) {
        return;
      }
      const last = lastPointerRef.current;
      const instance = reactFlowRef.current;
      if (last == null || instance == null) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const flowPos = instance.screenToFlowPosition({ x: last.clientX, y: last.clientY });
      spawnRerouteAt(flowPos);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [lastPointerRef, reactFlowRef, spawnRerouteAt]);
}
