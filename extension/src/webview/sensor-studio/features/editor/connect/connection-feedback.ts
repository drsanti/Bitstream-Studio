import type { Connection } from "@xyflow/react";
import { toast } from "react-toastify";
import type { ConnectionRejectReason } from "./socket-connection-policy";
import { connectionRejectMessage } from "./socket-connection-policy";
import type { SmartConnectDragContext } from "./smart-connect-catalog";

export type PendingGraphConnection = SmartConnectDragContext;

function handleElementUnderPointer(
  clientX: number,
  clientY: number,
): { nodeId: string; handleId: string; handleType: "source" | "target" } | null {
  const hits = document.elementsFromPoint(clientX, clientY);
  for (const el of hits) {
    if (!(el instanceof Element)) {
      continue;
    }
    const handle = el.classList.contains("react-flow__handle")
      ? el
      : el.closest(".react-flow__handle");
    if (handle == null) {
      continue;
    }
    const nodeId = handle.getAttribute("data-nodeid");
    const handleId = handle.getAttribute("data-handleid");
    if (nodeId == null || handleId == null || nodeId.length === 0) {
      continue;
    }
    const handleType: "source" | "target" = handle.classList.contains("source")
      ? "source"
      : handle.classList.contains("target")
        ? "target"
        : "source";
    return { nodeId, handleId, handleType };
  }
  return null;
}

export function isPointerOverFlowHandle(clientX: number, clientY: number): boolean {
  return handleElementUnderPointer(clientX, clientY) != null;
}

/** Build the connection attempted when releasing over a socket handle. */
export function resolveConnectionAtPointer(
  pending: PendingGraphConnection,
  clientX: number,
  clientY: number,
): Connection | null {
  const hit = handleElementUnderPointer(clientX, clientY);
  if (hit == null) {
    return null;
  }
  if (pending.handleType === "source") {
    if (hit.handleType !== "target") {
      return null;
    }
    return {
      source: pending.nodeId,
      sourceHandle: pending.handleId,
      target: hit.nodeId,
      targetHandle: hit.handleId,
    };
  }
  if (hit.handleType !== "source") {
    return null;
  }
  return {
    source: hit.nodeId,
    sourceHandle: hit.handleId,
    target: pending.nodeId,
    targetHandle: pending.handleId,
  };
}

export function toastVariantForRejectReason(
  reason: ConnectionRejectReason,
): "warning" | "info" {
  return reason === "duplicate_edge" ? "info" : "warning";
}

export function toastConnectionRejected(
  reason: ConnectionRejectReason,
  message?: string,
): void {
  const text = message ?? connectionRejectMessage(reason);
  const variant = toastVariantForRejectReason(reason);
  if (variant === "info") {
    toast.info(text);
  } else {
    toast.warning(text);
  }
}
