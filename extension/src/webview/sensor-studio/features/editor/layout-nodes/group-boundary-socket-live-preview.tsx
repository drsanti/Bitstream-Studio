import type { ReactNode } from "react";
import { SocketLivePreview } from "../nodes/flow-node/SocketLivePreview";
import { isStructuredSocketPreviewPortType } from "../nodes/flow-node/sync-socket-live-preview-handles";
import type { StudioPortType } from "../nodes/port-accent";
import type { StudioGroupBoundaryLiveFields } from "../subgraphs/studio-group-boundary-live";

export function groupBoundarySocketLivePreview(
  data: StudioGroupBoundaryLiveFields,
  handleId: string,
  portType: StudioPortType,
  portLabel: string,
  socketValuesVisible: boolean,
): ReactNode {
  if (!socketValuesVisible || isStructuredSocketPreviewPortType(portType)) {
    return null;
  }

  if (portType === "number") {
    const scalar = data.liveNumberByHandle?.[handleId];
    if (scalar == null) {
      return null;
    }
    return (
      <SocketLivePreview
        portType="number"
        handleId={handleId}
        portLabel={portLabel}
        scalar={scalar}
        streamMode="live"
      />
    );
  }

  if (portType === "boolean") {
    const value = data.liveBooleanByHandle?.[handleId];
    if (value === undefined) {
      return null;
    }
    return (
      <SocketLivePreview portType="boolean" handleId={handleId} booleanValue={value} />
    );
  }

  if (portType === "string") {
    const value = data.liveStringByHandle?.[handleId];
    if (value === undefined) {
      return null;
    }
    return (
      <SocketLivePreview portType="string" handleId={handleId} stringValue={value} textAlign="left" />
    );
  }

  if (portType === "vector3") {
    const vector3 = data.liveVector3ByHandle?.[handleId];
    if (vector3 == null) {
      return null;
    }
    return (
      <SocketLivePreview portType="vector3" handleId={handleId} vector3={vector3} />
    );
  }

  return null;
}
