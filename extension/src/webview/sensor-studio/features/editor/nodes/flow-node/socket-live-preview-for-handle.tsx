import type { ReactNode } from "react";
import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import type { StudioPortType } from "../port-accent";
import type { StudioNodeData } from "../../store/flow-editor.store";
import {
  isStudioAlignedOutputSocketColumnsNodeId,
  isStudioLiveReadingsInputNodeId,
  isStudioSensorTapNodeId,
} from "../../store/flow-editor.store";
import {
  catalogNodeHasStudioModelInput,
  resolveWiredStudioModelSelectNodeId,
  STUDIO_HANDLE_MODEL,
  type StudioFlowEdgeLike,
} from "../../model/model-generated-bindings";
import { flowAnimationWireFromAnimationClipEval } from "../animation/animation-clip-config";
import {
  isLikelyModelUrlString,
  modelSelectEmitDisplayName,
  modelUrlSocketDisplayLabel,
} from "../animation/model-select-emit-display-name";
import type { FlowWireAnimationV1 } from "../animation/flow-wire-animation";
import { flowAnimationWireFromBundleDefaultConfig } from "../animation/flow-wire-animation";
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
import { resolveAnimationWireSocketBadgeText } from "./resolve-animation-wire-socket-label";
import {
  resolveCameraWireSocketLabel,
  resolveEnvironmentWireSocketLabel,
} from "./structured-socket-preview-label";
import {
  flowWireMaterialFromMeshMaterialEval,
  isMeshMaterialNodeId,
  meshMaterialKindForNodeId,
  resolveMaterialWireSocketLabel,
} from "../material/mesh-material-config";
import type { FlowWireMaterialV1 } from "../material/flow-wire-material";
import {
  flowWireMeshFromMeshPrimitiveEval,
  isMeshWireOutputNodeId,
  meshPrimitiveKindForNodeId,
  resolveMeshWireSocketLabel,
} from "../mesh/mesh-primitive-config";
import type { FlowWireMeshV1 } from "../mesh/flow-wire-mesh";
import { STUDIO_HANDLE_ANIM, STUDIO_HANDLE_MESHES, STUDIO_HANDLE_OUT } from "../../studio-handle-ids";

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
    (catalogNodeHasStudioModelInput(catalogNodeId) && handleId === STUDIO_HANDLE_MODEL)
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
  const url =
    typeof defaultConfig.selectedModelUrl === "string"
      ? defaultConfig.selectedModelUrl.trim()
      : "";
  return (
    <SocketStructuredWireBadge
      label={fullLabel}
      title={url.length > 0 ? url : fullLabel}
      portType="string"
    />
  );
}

function genericStringSocketLivePreview(
  value: string,
  textAlign: "left" | "right",
  descriptors?: readonly StudioAssetDescriptor[],
) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (isLikelyModelUrlString(trimmed)) {
    const label = modelUrlSocketDisplayLabel(trimmed, descriptors ?? []);
    if (label.length === 0) {
      return null;
    }
    return (
      <SocketStructuredWireBadge
        label={label}
        title={trimmed}
        portType="string"
      />
    );
  }
  return (
    <SocketLivePreview portType="string" handleId="" stringValue={trimmed} textAlign={textAlign} />
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

const ANIMATION_OUTPUT_CATALOG_NODE_IDS = new Set([
  "animation-clip",
  "glb-animation-bundle",
  "animation-merge",
  "animation-mix",
  "animation-blend",
]);

function resolveOutputAnimationWire(data: StudioNodeData): FlowWireAnimationV1 | null {
  if (data.liveAnimationWire != null) {
    return data.liveAnimationWire;
  }
  if (data.nodeId === "animation-clip") {
    return flowAnimationWireFromAnimationClipEval({
      defaultConfig: data.defaultConfig,
      wired: {
        timeS: data.liveInputNumberByHandle?.time,
        speed: data.liveInputNumberByHandle?.speed,
        weight: data.liveInputNumberByHandle?.weight,
        enabled: data.liveInputBooleanByHandle?.enabled,
      },
    });
  }
  if (data.nodeId === "glb-animation-bundle") {
    return flowAnimationWireFromBundleDefaultConfig(data.defaultConfig);
  }
  return null;
}

function structuredAnimationSocketPreview(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  variant: "input" | "output",
): ReactNode {
  if (portType !== "glbAnimation") {
    return null;
  }

  let wire: FlowWireAnimationV1 | null = null;
  if (
    variant === "output" &&
    handleId === STUDIO_HANDLE_OUT &&
    ANIMATION_OUTPUT_CATALOG_NODE_IDS.has(data.nodeId)
  ) {
    wire = resolveOutputAnimationWire(data);
  } else if (variant === "input" && handleId === STUDIO_HANDLE_ANIM && data.liveAnimationWire != null) {
    wire = data.liveAnimationWire;
  }

  const { label, title } = resolveAnimationWireSocketBadgeText({
    wire,
    catalogNodeId: data.nodeId,
  });
  if (label.length === 0) {
    return null;
  }
  return (
    <SocketStructuredWireBadge
      label={label}
      title={title}
      portType="glbAnimation"
    />
  );
}

function resolveOutputMaterialWire(data: StudioNodeData): FlowWireMaterialV1 | null {
  if (data.liveMaterialWire != null) {
    return data.liveMaterialWire;
  }
  const kind = meshMaterialKindForNodeId(data.nodeId);
  if (kind == null) {
    return null;
  }
  return flowWireMaterialFromMeshMaterialEval({
    kind,
    defaultConfig: data.defaultConfig,
    wired: {
      color: data.liveInputVector3ByHandle?.color,
      opacity: data.liveInputNumberByHandle?.opacity,
      roughness: data.liveInputNumberByHandle?.roughness,
      metalness: data.liveInputNumberByHandle?.metalness,
    },
  });
}

function structuredMaterialSocketPreview(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  variant: "input" | "output",
): ReactNode {
  if (portType !== "material") {
    return null;
  }

  let wire: FlowWireMaterialV1 | null = null;
  if (
    variant === "output" &&
    handleId === STUDIO_HANDLE_OUT &&
    isMeshMaterialNodeId(data.nodeId)
  ) {
    wire = resolveOutputMaterialWire(data);
  } else if (variant === "input" && handleId === "material" && data.liveMaterialWire != null) {
    wire = data.liveMaterialWire;
  }

  const label = resolveMaterialWireSocketLabel(wire);
  if (label.length === 0) {
    return null;
  }
  return <SocketStructuredWireBadge label={label} title={label} portType="material" />;
}

function resolveOutputMeshWire(data: StudioNodeData): FlowWireMeshV1 | null {
  if (data.liveMeshWire != null) {
    return data.liveMeshWire;
  }
  if (data.nodeId === "mesh-group") {
    return data.liveMeshWire ?? null;
  }
  const kind = meshPrimitiveKindForNodeId(data.nodeId);
  if (kind == null) {
    return null;
  }
  return flowWireMeshFromMeshPrimitiveEval({
    kind,
    defaultConfig: data.defaultConfig,
    wired: {
      width: data.liveInputNumberByHandle?.width,
      height: data.liveInputNumberByHandle?.height,
      depth: data.liveInputNumberByHandle?.depth,
      radius: data.liveInputNumberByHandle?.radius,
      radiusTop: data.liveInputNumberByHandle?.radiusTop,
      radiusBottom: data.liveInputNumberByHandle?.radiusBottom,
      tube: data.liveInputNumberByHandle?.tube,
      length: data.liveInputNumberByHandle?.length,
      material: data.liveMaterialWire,
      transform: data.liveTransformWire,
    },
  });
}

function structuredMeshSocketPreview(
  data: StudioNodeData,
  handleId: string,
  portType: StudioPortType,
  variant: "input" | "output",
): ReactNode {
  if (portType !== "mesh") {
    return null;
  }

  let wire: FlowWireMeshV1 | null = null;
  if (
    variant === "output" &&
    handleId === STUDIO_HANDLE_OUT &&
    isMeshWireOutputNodeId(data.nodeId)
  ) {
    wire = resolveOutputMeshWire(data);
  } else if (
    variant === "input" &&
    (handleId === "mesh" || handleId === STUDIO_HANDLE_MESHES) &&
    data.liveMeshWire != null
  ) {
    wire = data.liveMeshWire;
  }

  const label = resolveMeshWireSocketLabel(wire);
  if (label.length === 0) {
    return null;
  }
  return <SocketStructuredWireBadge label={label} title={label} portType="mesh" />;
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
  descriptors?: readonly StudioAssetDescriptor[],
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
      return genericStringSocketLivePreview(fromHandle, "right", descriptors);
    }
    if (handleId === "out" && typeof data.liveValue === "string") {
      return genericStringSocketLivePreview(data.liveValue, "right", descriptors);
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
  descriptors?: readonly StudioAssetDescriptor[],
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
    return genericStringSocketLivePreview(value, "left", descriptors);
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
    const animationPreview = structuredAnimationSocketPreview(data, handleId, portType, "input");
    if (animationPreview != null) {
      return animationPreview;
    }
    const materialPreview = structuredMaterialSocketPreview(data, handleId, portType, "input");
    if (materialPreview != null) {
      return materialPreview;
    }
    const meshPreview = structuredMeshSocketPreview(data, handleId, portType, "input");
    if (meshPreview != null) {
      return meshPreview;
    }
    return structuredEnvironmentCameraSocketPreview(data, handleId, portType, "input", ctx);
  }
  return genericInputSocketLivePreview(data, handleId, portType, portLabel, ctx?.descriptors);
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
    const animationPreview = structuredAnimationSocketPreview(data, handleId, portType, "output");
    if (animationPreview != null) {
      return animationPreview;
    }
    const materialPreview = structuredMaterialSocketPreview(data, handleId, portType, "output");
    if (materialPreview != null) {
      return materialPreview;
    }
    const meshPreview = structuredMeshSocketPreview(data, handleId, portType, "output");
    if (meshPreview != null) {
      return meshPreview;
    }
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

  return genericSocketLivePreview(data, handleId, portType, portLabel, ctx?.descriptors);
}
