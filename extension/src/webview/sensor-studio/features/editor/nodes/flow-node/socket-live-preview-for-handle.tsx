import type { StudioPortType } from "../port-accent";
import type { StudioNodeData } from "../../store/flow-editor.store";
import {
  isStudioAlignedOutputSocketColumnsNodeId,
  isStudioLiveReadingsInputNodeId,
  isStudioSensorTapNodeId,
} from "../../store/flow-editor.store";
import { resolveLiveReadingStreamTone } from "./readings/live-reading-colors";
import { SocketLivePreview } from "./SocketLivePreview";

function vector3PreviewHandleIdForTapNode(nodeId: string, handleId: string): string {
  switch (nodeId) {
    case "bmi270-tap-euler":
      return "euler";
    case "bmi270-tap-accel":
      return "accel";
    case "bmi270-tap-gyro":
      return "gyro";
    case "bmm350-tap-magnetic":
      return "magnetic";
    default:
      return handleId;
  }
}

function scalarSocketPreviewProps(
  data: StudioNodeData,
  handleId: string,
  scalar: number | null | undefined,
  portLabel?: string,
) {
  return {
    portType: "number" as const,
    handleId,
    nodeId: data.nodeId,
    portLabel,
    scalar,
    streamMode: resolveLiveReadingStreamTone({
      sensorHealth: data.sensorHealth,
      lastValidAtIso: data.sensorLastValidAtByHandle?.[handleId],
      value: scalar,
    }),
  };
}

/** Live readout for an output handle on sensor source / tap nodes. */
export function socketLivePreviewForOutputHandle(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  portLabel?: string,
) {
  const { nodeId } = data;

  if (isStudioLiveReadingsInputNodeId(nodeId) || isStudioAlignedOutputSocketColumnsNodeId(nodeId)) {
    if (portType === "vector3") {
      const vector3 = data.liveVector3ByHandle?.[handleId];
      if (vector3 == null) {
        return null;
      }
      return (
        <SocketLivePreview
          portType="vector3"
          handleId={handleId}
          vector3={vector3}
        />
      );
    }

    if (portType === "quaternion") {
      const quaternion = data.liveQuaternionWire ?? { w: 1, x: 0, y: 0, z: 0 };
      return (
        <SocketLivePreview
          portType="quaternion"
          handleId={handleId}
          quaternion={quaternion}
        />
      );
    }

    if (portType === "number") {
      const scalar = data.liveNumberByHandle?.[handleId];
      return <SocketLivePreview {...scalarSocketPreviewProps(data, handleId, scalar, portLabel)} />;
    }

    return null;
  }

  if (!isStudioSensorTapNodeId(nodeId)) {
    return null;
  }

  if (portType === "quaternion") {
    if (data.liveQuaternionWire == null) {
      return null;
    }
    return (
      <SocketLivePreview
        portType="quaternion"
        handleId={handleId}
        quaternion={data.liveQuaternionWire}
      />
    );
  }

  if (portType === "vector3") {
    if (data.liveVector3Wire == null) {
      return null;
    }
    return (
      <SocketLivePreview
        portType="vector3"
        handleId={vector3PreviewHandleIdForTapNode(nodeId, handleId)}
        vector3={data.liveVector3Wire}
      />
    );
  }

  if (portType === "number") {
    const scalar = typeof data.liveValue === "number" ? data.liveValue : undefined;
    return <SocketLivePreview {...scalarSocketPreviewProps(data, handleId, scalar, portLabel)} />;
  }

  return null;
}
