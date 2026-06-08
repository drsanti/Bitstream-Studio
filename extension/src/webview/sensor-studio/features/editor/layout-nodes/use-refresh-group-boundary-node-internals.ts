import { useEffect } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";

/** React Flow must remeasure handles after group sockets are added, removed, or reordered. */
export function useRefreshGroupBoundaryNodeInternals(
  nodeId: string | undefined,
  socketIds: readonly string[],
): void {
  const updateNodeInternals = useUpdateNodeInternals();
  const socketKey = socketIds.join("\0");

  useEffect(() => {
    if (nodeId == null) {
      return;
    }
    updateNodeInternals(nodeId);
  }, [nodeId, socketKey, updateNodeInternals]);
}
