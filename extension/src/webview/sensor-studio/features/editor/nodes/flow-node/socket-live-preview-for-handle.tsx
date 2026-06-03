import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import type { StudioPortType } from "../port-accent";
import type { StudioNodeData } from "../../store/flow-editor.store";
import {
  isStudioAlignedOutputSocketColumnsNodeId,
  isStudioLiveReadingsInputNodeId,
  isStudioSensorTapNodeId,
} from "../../store/flow-editor.store";
import {
  isGlbEventActionCatalogNodeId,
  resolveWiredStudioModelSelectNodeId,
  STUDIO_HANDLE_MODEL,
  type StudioFlowEdgeLike,
} from "../../model/model-generated-bindings";
import { modelSelectEmitDisplayName } from "../animation/model-select-emit-display-name";
import {
  flowWireCameraFromNodeDefaultConfig,
} from "../camera-view/flow-wire-camera";
import {
  flowWireEnvironmentFromNodeDefaultConfig,
} from "../environment/flow-wire-environment";
import { resolveLiveReadingStreamTone } from "./readings/live-reading-colors";
import type { LiveScalarReadingColorHints, LiveReadingStreamTone } from "./readings/live-reading-colors";
import { isSocketValuesVisible } from "./socket-display";
import { isStructuredSocketPreviewPortType } from "./sync-socket-live-preview-handles";
import { SocketLivePreview } from "./SocketLivePreview";
import { SocketStructuredWireBadge } from "./SocketStructuredWireBadge";
import {
  resolveCameraWireSocketLabel,
  resolveEnvironmentWireSocketLabel,
} from "./structured-socket-preview-label";
import { truncateSocketStringPreview } from "./truncate-socket-string";

export type SocketPreviewContext = {
  flowNodeId?: string;
  descriptors?: readonly StudioAssetDescriptor[];
  flowNodes?: readonly { id: string; data: { nodeId: string; defaultConfig: Record<string, unknown> } }[];
  flowEdges?: readonly StudioFlowEdgeLike[];
};

function isModelStringSocketPort(catalogNodeId: string, handleId: string): boolean {
  return (
    (catalogNodeId === "model-select" && handleId === "out") ||
    (catalogNodeId === "model-viewer" && handleId === "in") ||
    (isGlbEventActionCatalogNodeId(catalogNodeId) && handleId === STUDIO_HANDLE_MODEL)
  );
}

function modelStringSocketLivePreview(
  defaultConfig: Record<string, unknown>,
  descriptors: readonly StudioAssetDescriptor[] | undefined,
) {
  const fullLabel = modelSelectEmitDisplayName(defaultConfig, descriptors ?? []);
  if (fullLabel.length === 0) {
    return null;
  }
  return (
    <SocketStructuredWireBadge
      label={truncateSocketStringPreview(fullLabel)}
      title={fullLabel}
      portType="string"
    />
  );
}

function modelStringInputSocketLivePreview(
  data: StudioNodeData,
  handleId: string,
  ctx: SocketPreviewContext,
) {
  let config: Record<string, unknown> | undefined;
  if (ctx.flowNodeId != null && ctx.flowNodes != null && ctx.flowEdges != null) {
    const wiredId = resolveWiredStudioModelSelectNodeId({
      targetFlowNodeId: ctx.flowNodeId,
      targetHandle: handleId,
      edges: ctx.flowEdges,
      nodes: ctx.flowNodes,
    });
    if (wiredId != null) {
      const parent = ctx.flowNodes.find((n) => n.id === wiredId);
      config = parent?.data.defaultConfig;
    }
  }
  if (config == null) {
    const url = data.liveInputStringByHandle?.[handleId];
    if (url == null || url.length === 0) {
      return null;
    }
    config = { selectedModelUrl: url };
  }
  return modelStringSocketLivePreview(config, ctx.descriptors);
}

function structuredEnvironmentCameraSocketPreview(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  variant: "input" | "output",
  ctx?: SocketPreviewContext,
) {
  if (portType !== "environment" && portType !== "camera") {
    return null;
  }

  let label: string | undefined;
  if (variant === "output") {
    if (portType === "environment" && data.nodeId === "environment" && handleId === "out") {
      label = resolveEnvironmentWireSocketLabel(
        flowWireEnvironmentFromNodeDefaultConfig(data.defaultConfig),
        ctx?.descriptors ?? [],
      );
    } else if (portType === "camera" && data.nodeId === "camera-view" && handleId === "out") {
      label = resolveCameraWireSocketLabel(
        flowWireCameraFromNodeDefaultConfig(data.defaultConfig),
      );
    }
  } else if (portType === "environment" && handleId === "env" && data.liveEnvironmentWire != null) {
    label = resolveEnvironmentWireSocketLabel(data.liveEnvironmentWire, ctx?.descriptors ?? []);
  } else if (portType === "camera" && handleId === "cam" && data.liveCameraWire != null) {
    label = resolveCameraWireSocketLabel(data.liveCameraWire);
  }

  if (label == null || label.length === 0) {
    return null;
  }
  return <SocketStructuredWireBadge label={label} portType={portType} />;
}

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
        signedPositive={handleId === "samples" ? false : true}
        fractionDigitsOverride={handleId === "samples" ? 0 : undefined}
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

  if (portType === "quaternion") {
    const quaternion = data.liveQuaternionWire;
    if (quaternion == null) {
      return null;
    }
    return (
      <SocketLivePreview
        portType="quaternion"
        handleId={handleId}
        quaternion={quaternion}
        streamMode="live"
      />
    );
  }

  if (portType === "number") {
    const scalar =
      data.liveInputNumberByHandle?.[handleId] ??
      // Transform nodes: show defaults on socket rows when pins are unwired.
      (data.nodeId === "clamp" ||
      data.nodeId === "map-range"
        ? (() => {
            const raw = (data.defaultConfig as Record<string, unknown> | undefined)?.[handleId];
            const n = typeof raw === "number" ? raw : Number(raw);
            return Number.isFinite(n) ? n : undefined;
          })()
        : undefined);
    const upstreamHint = data.liveInputScalarHintsByHandle?.[handleId];
    return (
      <SocketLivePreview
        {...scalarSocketPreviewProps(
          data,
          handleId,
          scalar,
          portLabel,
          upstreamHint?.streamMode ?? (data.liveInputNumberByHandle?.[handleId] == null ? "local" : undefined),
          upstreamHint,
        )}
        textAlign="left"
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
      <SocketLivePreview portType="string" handleId={handleId} stringValue={value} textAlign="left" />
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
  ctx?: SocketPreviewContext,
) {
  if (!isSocketValuesVisible(data.ui)) {
    return null;
  }
  if (
    portType === "string" &&
    isModelStringSocketPort(data.nodeId, handleId) &&
    ctx != null
  ) {
    return modelStringInputSocketLivePreview(data, handleId, ctx);
  }
  if (isStructuredSocketPreviewPortType(portType)) {
    return structuredEnvironmentCameraSocketPreview(data, handleId, portType, "input", ctx);
  }
  return genericInputSocketLivePreview(data, handleId, portType, portLabel);
}

/** Live readout for an output handle on sensor source / tap nodes and all scalar dataflow outputs. */
export function socketLivePreviewForOutputHandle(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  portLabel?: string,
  ctx?: SocketPreviewContext,
) {
  if (!isSocketValuesVisible(data.ui)) {
    return null;
  }
  const { nodeId } = data;

  if (
    portType === "string" &&
    isModelStringSocketPort(nodeId, handleId)
  ) {
    return modelStringSocketLivePreview(data.defaultConfig, ctx?.descriptors);
  }

  if (isStructuredSocketPreviewPortType(portType)) {
    return structuredEnvironmentCameraSocketPreview(data, handleId, portType, "output", ctx);
  }

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
      const scalar =
        data.liveNumberByHandle?.[handleId] ??
        // Sensor sample counters are always present when the stream is live, but keep the UI stable
        // even if a specific payload variant omitted the row's other fields.
        (handleId === "samples" ? 0 : undefined);
      return (
        <SocketLivePreview
          {...scalarSocketPreviewProps(data, handleId, scalar, portLabel)}
          signedPositive={handleId === "samples" ? false : true}
          fractionDigitsOverride={handleId === "samples" ? 0 : undefined}
        />
      );
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
      const isSamplesCounter =
        nodeId.endsWith("-tap-samples") || portLabel === "Samples" || String(portLabel ?? "").includes("Samples");
      return (
        <SocketLivePreview
          {...scalarSocketPreviewProps(data, handleId, scalar, portLabel)}
          signedPositive={isSamplesCounter ? false : true}
          fractionDigitsOverride={isSamplesCounter ? 0 : undefined}
        />
      );
    }

    return null;
  }

  return genericSocketLivePreview(data, handleId, portType, portLabel);
}
