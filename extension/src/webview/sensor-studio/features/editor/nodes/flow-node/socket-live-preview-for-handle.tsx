import type { StudioPortType } from "../port-accent";
import type { StudioNodeData } from "../../store/flow-editor.store";
import {
  isStudioAlignedOutputSocketColumnsNodeId,
  isStudioLiveReadingsInputNodeId,
  isStudioSensorTapNodeId,
} from "../../store/flow-editor.store";
import { resolveLiveReadingStreamTone } from "./readings/live-reading-colors";
import type { LiveScalarReadingColorHints, LiveReadingStreamTone } from "./readings/live-reading-colors";
import { isStructuredSocketPreviewPortType } from "./sync-socket-live-preview-handles";
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
  streamMode?: LiveReadingStreamTone,
  colorHints?: LiveScalarReadingColorHints,
) {
  const hints = colorHints ?? { handleId, nodeId: data.nodeId, label: portLabel };
  return {
    portType: "number" as const,
    handleId: hints.handleId ?? handleId,
    nodeId: hints.nodeId ?? data.nodeId,
    portLabel: hints.label ?? portLabel,
    scalar,
    streamMode:
      streamMode ??
      resolveLiveReadingStreamTone({
        sensorHealth: data.sensorHealth,
        lastValidAtIso: data.sensorLastValidAtByHandle?.[handleId],
        value: scalar,
      }),
  };
}

function genericSocketLivePreview(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  portLabel?: string,
) {
  if (isStructuredSocketPreviewPortType(portType)) {
    return null;
  }

  if (portType === "vector3") {
    const vector3 =
      data.liveVector3ByHandle?.[handleId] ??
      (handleId === "out" && data.liveVector3Wire != null ? data.liveVector3Wire : null);
    if (vector3 == null) {
      return null;
    }
    return (
      <SocketLivePreview portType="vector3" handleId={handleId} vector3={vector3} streamMode="live" />
    );
  }

  if (portType === "quaternion") {
    const quaternion = handleId === "out" ? (data.liveQuaternionWire ?? null) : null;
    if (quaternion == null) {
      return null;
    }
    return (
      <SocketLivePreview portType="quaternion" handleId={handleId} quaternion={quaternion} />
    );
  }

  if (portType === "number") {
    const scalar =
      data.liveNumberByHandle?.[handleId] ??
      (handleId === "out" && typeof data.liveValue === "number" ? data.liveValue : undefined);
    return (
      <SocketLivePreview
        {...scalarSocketPreviewProps(data, handleId, scalar, portLabel, "live")}
      />
    );
  }

  if (portType === "boolean") {
    const fromHandle = data.liveBooleanByHandle?.[handleId];
    if (fromHandle !== undefined) {
      return (
        <SocketLivePreview portType="boolean" handleId={handleId} booleanValue={fromHandle} />
      );
    }
    if (handleId === "out" && typeof data.liveValue === "boolean") {
      return (
        <SocketLivePreview portType="boolean" handleId={handleId} booleanValue={data.liveValue} />
      );
    }
    return null;
  }

  if (portType === "string") {
    const fromHandle = data.liveStringByHandle?.[handleId];
    if (fromHandle !== undefined) {
      return (
        <SocketLivePreview portType="string" handleId={handleId} stringValue={fromHandle} />
      );
    }
    if (handleId === "out" && typeof data.liveValue === "string") {
      return (
        <SocketLivePreview portType="string" handleId={handleId} stringValue={data.liveValue} />
      );
    }
    return null;
  }

  return null;
}

function genericInputSocketLivePreview(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  portLabel?: string,
) {
  if (isStructuredSocketPreviewPortType(portType)) {
    return null;
  }

  if (portType === "vector3") {
    const vector3 = data.liveInputVector3ByHandle?.[handleId];
    if (vector3 == null) {
      return null;
    }
    return (
      <SocketLivePreview portType="vector3" handleId={handleId} vector3={vector3} streamMode="live" />
    );
  }

  if (portType === "number") {
    const scalar = data.liveInputNumberByHandle?.[handleId];
    const upstreamHint = data.liveInputScalarHintsByHandle?.[handleId];
    return (
      <SocketLivePreview
        {...scalarSocketPreviewProps(
          data,
          handleId,
          scalar,
          portLabel,
          upstreamHint?.streamMode,
          upstreamHint,
        )}
      />
    );
  }

  if (portType === "boolean") {
    const value = data.liveInputBooleanByHandle?.[handleId];
    if (value === undefined) {
      return null;
    }
    return (
      <SocketLivePreview portType="boolean" handleId={handleId} booleanValue={value} />
    );
  }

  if (portType === "string") {
    const value = data.liveInputStringByHandle?.[handleId];
    if (value === undefined) {
      return null;
    }
    return (
      <SocketLivePreview portType="string" handleId={handleId} stringValue={value} />
    );
  }

  return null;
}

/** Live readout for an input handle (wired incoming scalar values). */
export function socketLivePreviewForInputHandle(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  portLabel?: string,
) {
  return genericInputSocketLivePreview(data, handleId, portType, portLabel);
}

/** Live readout for an output handle on sensor source / tap nodes and all scalar dataflow outputs. */
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

  if (isStudioSensorTapNodeId(nodeId)) {
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

  return genericSocketLivePreview(data, handleId, portType, portLabel);
}
