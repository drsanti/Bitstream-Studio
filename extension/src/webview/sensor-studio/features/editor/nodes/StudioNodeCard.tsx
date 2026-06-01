import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import { ChevronDown } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import type { StudioNodeData } from "../store/flow-editor.store";
import {
  isStudioSensorTapNodeId,
  STUDIO_FLOW_SENSOR_HEADER_TAG_BY_NODE_ID,
  isStudioAlignedOutputSocketColumnsNodeId,
  isStudioSensorSocketPreviewNodeId,
} from "../store/flow-editor.store";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { studioPortAccent } from "./port-accent";
import {
  FlowNodeBody,
  FlowNodeEdgeResize,
  FlowNodeHeader,
  FlowNodeShell,
  FlowNodeSocketDot,
  FlowNodeSocketRegion,
  FlowNodeSocketRow,
  QuaternionScalarsGrid,
  ReadingAxisNumber,
  ReadingLabel,
  ReadingPanel,
  ReadingNumber,
  Vec3ReadingRow,
} from "./flow-node";
import { socketLivePreviewForOutputHandle } from "./flow-node/socket-live-preview-for-handle";
import { flowNodeHandleStyle } from "./flow-node/flow-node-handle-style";
import { FLOW_NODE_HEADER_BADGE_CLASS } from "./flow-node/theme/flow-node-tokens";
import { ModelSelectNodePanel } from "./model-nodes/ModelSelectNodePanel";
import { GlbMaterialTextureNodePanel } from "./material/GlbMaterialTextureNodePanel";
import { GlbMaterialColorNodePanel } from "./material/GlbMaterialColorNodePanel";
import { MathNodePanel } from "./math/MathNodePanel";
import { CompareNodePanel } from "./math/CompareNodePanel";
import { ModelViewerNodePanel } from "./model-nodes/ModelViewerNodePanel";
import {
  BooleanConstantNodePanel,
  NumberConstantNodePanel,
} from "./constants/ConstantGeneratorPanels";
import { EnvironmentNodePanel } from "./environment/EnvironmentNodePanel";
import { CameraViewNodePanel } from "./camera-view/CameraViewNodePanel";
import { RotationPreviewPanelV4 } from "./rotation/RotationPreviewPanelV4";
import { PlotterCanvas } from "./plotter/PlotterCanvas";
import { RadialGaugeNodePanel } from "./radial-gauge/RadialGaugeNodePanel";
import { BarMeterNodePanel } from "./bar-meter/BarMeterNodePanel";
import { LedIndicatorNodePanel } from "./led-indicator/LedIndicatorNodePanel";
import { KnobNodePanel } from "./knob/KnobNodePanel";
import { NumericDisplayNodePanel } from "./numeric-display/NumericDisplayNodePanel";
import {
  coercePlotterConfig,
  isPlotterNodeId,
  PLOTTER_INPUT_IDS,
} from "./plotter/plotter-config";
import {
  isRotation3DCatalogNodeId,
} from "./rotation/rotation-3d-node-ids";
import { coerceScene3DConfigV1, defaultScene3DConfig } from "./rotation/scene3d-config";
import { mergeFlowWireEnvironmentIntoScene3d } from "./environment/flow-wire-environment";
import { mergeFlowWireCameraIntoScene3d } from "./camera-view/flow-wire-camera";
import { mergeFlowWireTransformIntoScene3d } from "./transform/flow-wire-transform";
import { buildGlbAnimationPreviewSceneProps } from "../gltf/build-glb-animation-preview-scene-props";
import { buildGlbScalarPreviewSceneProps } from "../gltf/build-glb-scalar-preview-scene-props";
import { EventSetBooleanNodePanel, EventSetGlbPartNodePanel, EventToggleBooleanNodePanel, EventToggleGlbPartNodePanel, EventTriggerGlbAnimNodePanel, OnClickNodePanel, OnKeyNodePanel } from "./events/EventFlowNodePanels";
import type { RotationPreviewSceneProps } from "../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";

const handleBaseClass =
  "!z-20 !h-2.5 !w-2.5 !border-2 !bg-zinc-900 [&.react-flow__handle]:pointer-events-auto";

const handleDotClass =
  "relative flex h-6 w-0 items-center justify-center overflow-visible";

const AGE_BADGE_LIVE_MAX_SEC = 1;
const AGE_BADGE_STALE_MAX_SEC = 3.5;

export function StudioNodeCard(props: NodeProps) {
  const { id, selected: selectedFromRf } = props;
  const data = props.data as StudioNodeData;
  /** RF does not always surface `selected` on custom nodes consistently; mirror `node.selected` from the store. */
  const selectedInDocument = useFlowEditorStore(
    (s) => s.nodes.find((n) => n.id === id)?.selected === true,
  );
  const primarySelectedId = useFlowEditorStore((s) => s.selectedNodeId);
  const updateNodeConfigFieldByNodeId = useFlowEditorStore(
    (s) => s.updateNodeConfigFieldByNodeId,
  );
  const setStudioUtilityNodeBodyExpanded = useFlowEditorStore(
    (s) => s.setStudioUtilityNodeBodyExpanded,
  );
  const updateNodeInternals = useUpdateNodeInternals();
  const isSelected = Boolean(
    selectedFromRf || selectedInDocument || primarySelectedId === id,
  );
  const isRotationNode = isRotation3DCatalogNodeId(data.nodeId);
  const flowBodyFlexCol =
    isRotationNode ||
    isPlotterNodeId(data.nodeId) ||
    data.nodeId === "radial-gauge" ||
    data.nodeId === "bar-meter" ||
    data.nodeId === "knob";
  const hasInvalid =
    (typeof data.sensorInvalidReason === "string" &&
      data.sensorInvalidReason.length > 0) ||
    (data.sensorInvalidByHandle != null &&
      Object.keys(data.sensorInvalidByHandle).length > 0);
  const lastValidTitle = (handle: string): string | undefined => {
    const iso = data.sensorLastValidAtByHandle?.[handle];
    if (iso == null) {
      return undefined;
    }
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) {
      return undefined;
    }
    return `Last valid: ${dt.toLocaleString()}`;
  };
  const lastValidAgeText = (handle: string): string | null => {
    const iso = data.sensorLastValidAtByHandle?.[handle];
    if (iso == null) {
      return null;
    }
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) {
      return null;
    }
    const ageSec = Math.max(0, (Date.now() - ts) / 1000);
    if (ageSec < 10) {
      return `${ageSec.toFixed(1)}s`;
    }
    return `${Math.round(ageSec)}s`;
  };
  const renderLabelWithAge = (label: string, handle: string) => {
    const age = lastValidAgeText(handle);
    const ageSecRaw = (() => {
      const iso = data.sensorLastValidAtByHandle?.[handle];
      if (iso == null) {
        return null;
      }
      const ts = new Date(iso).getTime();
      if (Number.isNaN(ts)) {
        return null;
      }
      return Math.max(0, (Date.now() - ts) / 1000);
    })();
    const ageBadgeClass =
      ageSecRaw == null
        ? "border-zinc-600/70 bg-zinc-900/70 text-zinc-300"
        : ageSecRaw <= AGE_BADGE_LIVE_MAX_SEC
          ? "border-emerald-500/60 bg-emerald-950/45 text-emerald-200"
          : ageSecRaw <= AGE_BADGE_STALE_MAX_SEC
            ? "border-amber-500/60 bg-amber-950/45 text-amber-200"
            : "border-rose-500/65 bg-rose-950/45 text-rose-200";
    return (
      <span className="inline-flex items-center gap-1">
        <span className="min-w-0">{label}</span>
        {age != null ? (
          <span
            className={`rounded border px-1 py-px text-[9px] font-medium ${ageBadgeClass}`}
            title={lastValidTitle(handle)}
          >
            {age}
          </span>
        ) : null}
      </span>
    );
  };
  const liveValue =
    typeof data.liveValue === "number"
      ? data.liveValue.toFixed(4)
      : data.liveValue == null
        ? "-"
        : String(data.liveValue);
  const sparklineBars = (data.liveHistory ?? []).slice(-24);
  const maxAbs = sparklineBars.reduce(
    (acc, value) => Math.max(acc, Math.abs(value)),
    1,
  );
  const indicatorOn = data.nodeId === "indicator" && data.liveValue === true;
  const gaugeValue = typeof data.liveValue === "number" ? data.liveValue : 0;
  const gaugeRatio = Math.max(0, Math.min(1, (gaugeValue + 1) / 2));
  const gaugeDecimals =
    typeof data.defaultConfig.decimals === "number"
      ? Math.max(0, Math.min(6, Math.round(data.defaultConfig.decimals)))
      : 3;
  const gaugeUnit =
    typeof data.defaultConfig.unit === "string" ? data.defaultConfig.unit : "";
  const sparkPoints =
    sparklineBars.length > 0
      ? sparklineBars
          .map((value, index) => {
            const x =
              sparklineBars.length <= 1
                ? 0
                : (index / (sparklineBars.length - 1)) * 100;
            const normalized = (value + maxAbs) / (maxAbs * 2);
            const y = (1 - normalized) * 100;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
          })
          .join(" ")
      : "";

  /** Hide `sim` — only surfaced when hardware stream is absent (no extra pill). */
  const sensorHealthBadge =
    data.sensorHealth != null && data.sensorHealth !== "sim" ? (
      <span
        className={`${FLOW_NODE_HEADER_BADGE_CLASS} ${
          data.sensorHealth === "live"
            ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-300"
            : data.sensorHealth === "stale"
              ? "border-amber-500/60 bg-amber-950/45 text-amber-200"
              : data.sensorHealth === "offline"
                ? "border-rose-500/65 bg-rose-950/45 text-rose-200"
                : "border-zinc-500/60 bg-zinc-900/60 text-zinc-300"
        }`}
      >
        {data.sensorHealth}
      </span>
    ) : null;

  const invalidBadge = hasInvalid ? (
    <span className={`${FLOW_NODE_HEADER_BADGE_CLASS} border-rose-500/70 bg-rose-950/45 text-rose-200`}>
      Invalid
    </span>
  ) : null;

  const sensorFamilyTagLabel =
    STUDIO_FLOW_SENSOR_HEADER_TAG_BY_NODE_ID[data.nodeId];
  const labelNorm = data.label.trim().toLowerCase();
  const tagNorm = sensorFamilyTagLabel?.trim().toLowerCase();
  const showSensorFamilyTag =
    sensorFamilyTagLabel != null &&
    tagNorm != null &&
    tagNorm.length > 0 &&
    labelNorm !== tagNorm;
  const sensorFamilyTag =
    showSensorFamilyTag ? (
      <span className={`${FLOW_NODE_HEADER_BADGE_CLASS} border-cyan-500/45 bg-cyan-950/35 text-cyan-200/90`}>
        {sensorFamilyTagLabel}
      </span>
    ) : null;

  const envDc = data.defaultConfig as Record<string, unknown>;
  const environmentControlsExpanded =
    data.nodeId === "environment"
      ? typeof envDc.environmentControlsExpanded === "boolean"
        ? envDc.environmentControlsExpanded
        : true
      : true;

  const cameraDc = data.defaultConfig as Record<string, unknown>;
  const cameraViewControlsExpanded =
    data.nodeId === "camera-view"
      ? typeof cameraDc.cameraViewControlsExpanded === "boolean"
        ? cameraDc.cameraViewControlsExpanded
        : true
      : true;

  const utilityBodyFitsContent =
    (data.nodeId === "environment" && !environmentControlsExpanded) ||
    (data.nodeId === "camera-view" && !cameraViewControlsExpanded) ||
    data.nodeId === "object-transform" ||
    data.nodeId === "transform-from-euler" ||
    data.nodeId === "on-key" ||
    data.nodeId === "on-click" ||
    data.nodeId === "event-toggle-boolean" ||
    data.nodeId === "event-set-boolean" ||
    data.nodeId === "event-toggle-glb-part" ||
    data.nodeId === "event-set-glb-part" ||
    data.nodeId === "event-trigger-glb-anim" ||
    isStudioSensorSocketPreviewNodeId(data.nodeId);

  const mathOperation =
    data.nodeId === "math" && typeof data.defaultConfig.operation === "string"
      ? data.defaultConfig.operation
      : null;

  useLayoutEffect(() => {
    if (data.nodeId === "camera-view" || data.nodeId === "environment" || data.nodeId === "math") {
      updateNodeInternals(id);
    }
  }, [
    id,
    data.nodeId,
    mathOperation,
    data.inputHandles?.length,
    cameraViewControlsExpanded,
    environmentControlsExpanded,
    updateNodeInternals,
  ]);

  const environmentBodyToggle =
    data.nodeId === "environment" ? (
      <button
        type="button"
        className="nodrag inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-600/80 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800/80"
        title={environmentControlsExpanded ? "Hide environment controls" : "Show environment controls"}
        aria-expanded={environmentControlsExpanded}
        onClick={() => {
          setStudioUtilityNodeBodyExpanded(
            id,
            "environmentControlsExpanded",
            !environmentControlsExpanded,
          );
        }}
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${environmentControlsExpanded ? "" : "-rotate-90"}`}
          aria-hidden
        />
      </button>
    ) : null;

  const cameraViewBodyToggle =
    data.nodeId === "camera-view" ? (
      <button
        type="button"
        className="nodrag inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-600/80 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800/80"
        title={cameraViewControlsExpanded ? "Hide camera controls" : "Show camera controls"}
        aria-expanded={cameraViewControlsExpanded}
        onClick={() => {
          setStudioUtilityNodeBodyExpanded(
            id,
            "cameraViewControlsExpanded",
            !cameraViewControlsExpanded,
          );
        }}
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${cameraViewControlsExpanded ? "" : "-rotate-90"}`}
          aria-hidden
        />
      </button>
    ) : null;

  const headerTrailing =
    data.nodeId === "environment" ||
    data.nodeId === "camera-view" ||
    sensorHealthBadge != null ||
    invalidBadge != null ||
    sensorFamilyTag != null ? (
      <div className="inline-flex items-center gap-1.5">
        {environmentBodyToggle}
        {cameraViewBodyToggle}
        {sensorHealthBadge != null || invalidBadge != null || sensorFamilyTag != null ? (
          <div className="inline-flex flex-row-reverse items-center gap-1">
            {sensorFamilyTag}
            {invalidBadge}
            {sensorHealthBadge}
          </div>
        ) : null}
      </div>
    ) : null;

  const hasSocketRegion =
    data.inputType != null ||
    (data.inputHandles != null && data.inputHandles.length > 0) ||
    data.outputType != null ||
    (data.outputHandles != null && data.outputHandles.length > 0);

  const nodeResizable = data.ui?.resizable === true;
  const minNodeWidth =
    typeof data.ui?.minWidth === "number" && Number.isFinite(data.ui.minWidth)
      ? Math.round(data.ui.minWidth)
      : 170;
  const minNodeHeight =
    typeof data.ui?.minHeight === "number" && Number.isFinite(data.ui.minHeight)
      ? Math.round(data.ui.minHeight)
      : 64;

  const inputSockets: ReactNode[] =
    data.inputHandles != null && data.inputHandles.length > 0
      ? data.inputHandles.map((h) => (
          <FlowNodeSocketRow
            key={h.id}
            variant="input"
            label={<span className="text-zinc-400">{h.label}</span>}
            socket={
              <FlowNodeSocketDot className={handleDotClass}>
                <Handle
                  id={h.id}
                  type="target"
                  position={Position.Left}
                  className={handleBaseClass}
                  style={flowNodeHandleStyle("left", studioPortAccent(h.portType))}
                />
              </FlowNodeSocketDot>
            }
          />
        ))
      : data.inputType != null
        ? [
            <FlowNodeSocketRow
              key="in"
              variant="input"
              label={
                <span className="font-medium text-zinc-200">
                  In · {data.inputType}
                </span>
              }
              socket={
                <FlowNodeSocketDot className={handleDotClass}>
                  <Handle
                    id="in"
                    type="target"
                    position={Position.Left}
                    className={handleBaseClass}
                    style={flowNodeHandleStyle("left", studioPortAccent(data.inputType))}
                  />
                </FlowNodeSocketDot>
              }
            />,
          ]
        : [];

  const alignedOutputSocketColumns = isStudioAlignedOutputSocketColumnsNodeId(data.nodeId);

  const outputSockets =
    data.outputHandles != null && data.outputHandles.length > 0
      ? data.outputHandles.map((h) => {
          const preview = socketLivePreviewForOutputHandle(data, h.id, h.portType, h.label);
          return (
          <FlowNodeSocketRow
            key={h.id}
            variant="output"
            alignedOutputColumns={alignedOutputSocketColumns}
            leadingPreview={preview ?? undefined}
            label={<span className="text-zinc-400">{h.label}</span>}
            socket={
              <FlowNodeSocketDot className={handleDotClass}>
                <Handle
                  id={h.id}
                  type="source"
                  position={Position.Right}
                  className={handleBaseClass}
                  style={flowNodeHandleStyle("right", studioPortAccent(h.portType))}
                />
              </FlowNodeSocketDot>
            }
          />
          );
        })
      : data.outputType != null
        ? (() => {
            const preview = socketLivePreviewForOutputHandle(
              data,
              "out",
              data.outputType,
            );
            return [
            <FlowNodeSocketRow
              key="out"
              variant="output"
              leadingPreview={preview ?? undefined}
              label={
                <span className="text-zinc-400">Out · {data.outputType}</span>
              }
              socket={
                <FlowNodeSocketDot className={handleDotClass}>
                  <Handle
                    id="out"
                    type="source"
                    position={Position.Right}
                    className={handleBaseClass}
                    style={flowNodeHandleStyle("right", studioPortAccent(data.outputType))}
                  />
                </FlowNodeSocketDot>
              }
            />,
          ];
          })()
        : [];

  const rotationShowGrid =
    typeof data.defaultConfig.showGrid === "boolean"
      ? data.defaultConfig.showGrid
      : true;

  const isRotation3dNode = isRotation3DCatalogNodeId(data.nodeId);
  const flowNodes = useFlowEditorStore((s) => s.nodes);
  const flowEdges = useFlowEditorStore((s) => s.edges);

  type RotationPreviewScenePropsV4 = RotationPreviewSceneProps & { scene3d?: unknown };
  const scene3d =
    data.defaultConfig.scene3d != null
      ? coerceScene3DConfigV1(data.defaultConfig.scene3d)
      : defaultScene3DConfig();

  const scene3dForPreview = useMemo(
    () =>
      mergeFlowWireTransformIntoScene3d(
        mergeFlowWireCameraIntoScene3d(
          mergeFlowWireEnvironmentIntoScene3d(scene3d, data.liveEnvironmentWire ?? null),
          data.liveCameraWire ?? null,
        ),
        data.liveTransformWire ?? null,
      ),
    [scene3d, data.liveEnvironmentWire, data.liveCameraWire, data.liveTransformWire],
  );

  const rotationGlbSceneProps = useMemo(
    () =>
      isRotation3dNode
        ? {
            ...buildGlbScalarPreviewSceneProps({
              nodes: flowNodes,
              edges: flowEdges,
              flowNodeId: id,
              catalogNodeId: data.nodeId,
              defaultConfig: data.defaultConfig,
            }),
            ...buildGlbAnimationPreviewSceneProps({
              nodes: flowNodes,
              edges: flowEdges,
              flowNodeId: id,
              catalogNodeId: data.nodeId,
              defaultConfig: data.defaultConfig,
              liveAnimationWire: data.liveAnimationWire ?? null,
            }),
          }
        : {},
    [
      isRotation3dNode,
      flowNodes,
      flowEdges,
      id,
      data.nodeId,
      data.defaultConfig,
      data.liveAnimationWire,
    ],
  );

  const eulerScene = useMemo<RotationPreviewScenePropsV4 | null>(() => {
    if (data.liveVector3Wire == null) {
      return null;
    }
    if (data.nodeId !== "rotation-3d-euler") {
      return null;
    }
    return {
      qw: 1,
      qx: 0,
      qy: 0,
      qz: 0,
      fusionEulerHundredths: {
        roll: Math.round(data.liveVector3Wire.x * 100),
        pitch: Math.round(data.liveVector3Wire.y * 100),
        heading: Math.round(data.liveVector3Wire.z * 100),
      },
      meshOrientationFromEulerFallback: false,
      eulerOnly: true,
      showGrid: rotationShowGrid,
      scene3d: scene3dForPreview,
      ...rotationGlbSceneProps,
    };
  }, [
    data.liveVector3Wire,
    data.nodeId,
    rotationShowGrid,
    scene3dForPreview,
    rotationGlbSceneProps,
  ]);

  const quaternionScene = useMemo<RotationPreviewScenePropsV4 | null>(() => {
    if (data.liveQuaternionWire == null) {
      return null;
    }
    if (data.nodeId !== "rotation-3d-quaternion") {
      return null;
    }
    return {
      qw: data.liveQuaternionWire.w,
      qx: data.liveQuaternionWire.x,
      qy: data.liveQuaternionWire.y,
      qz: data.liveQuaternionWire.z,
      fusionEulerHundredths: null,
      meshOrientationFromEulerFallback: false,
      showGrid: rotationShowGrid,
      scene3d: scene3dForPreview,
      ...rotationGlbSceneProps,
    };
  }, [
    data.liveQuaternionWire,
    data.nodeId,
    rotationShowGrid,
    scene3dForPreview,
    rotationGlbSceneProps,
  ]);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const resizeActive = isSelected && nodeResizable;

  return (
    <div
      ref={shellRef}
      className={`relative w-full min-w-0 max-w-full ${utilityBodyFitsContent ? "h-auto" : "h-full"}`}
    >
      <FlowNodeEdgeResize
        nodeId={id}
        active={resizeActive}
        minWidth={minNodeWidth}
        minHeight={minNodeHeight}
        shellRef={shellRef}
      />
      <FlowNodeShell
        glass
        glassPreset="medium"
        style={{
          width: "100%",
          height: utilityBodyFitsContent ? "auto" : "100%",
        }}
        className={[
          isSelected
            ? /* Keep base drop shadow + outer “ring” via shadow only (no border width jump). */
              "shadow-[0_8px_24px_rgba(0,0,0,0.35),0_0_0_2px_rgba(0,200,200,0.5)] transition-shadow duration-150"
            : "transition-shadow duration-150",
          isPlotterNodeId(data.nodeId) || data.nodeId === "model-viewer"
            ? "min-h-0"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <FlowNodeHeader
          glass
          glassPreset="medium"
          className="studio-node-drag-handle cursor-move"
          primary={
            <div className="text-[13px] font-semibold leading-tight text-zinc-100">
              {data.label}
            </div>
          }
          trailing={headerTrailing}
        />

        {hasSocketRegion ? (
          <FlowNodeSocketRegion
            alignedOutputColumns={alignedOutputSocketColumns}
            className={
              isPlotterNodeId(data.nodeId)
                ? "pb-0 pt-1.5"
                : alignedOutputSocketColumns
                  ? "w-full max-w-full"
                  : undefined
            }
          >
            {inputSockets}
            {outputSockets}
          </FlowNodeSocketRegion>
        ) : null}

        {typeof data.sensorInvalidReason === "string" &&
        data.sensorInvalidReason.length > 0 ? (
          <div className="nodrag px-3 pt-2 text-[10px] text-rose-300/90">
            {data.sensorInvalidReason}
          </div>
        ) : null}
        {data.sensorInvalidByHandle != null &&
        Object.keys(data.sensorInvalidByHandle).length > 0 ? (
          <div className="nodrag px-3 pt-1 text-[10px] text-rose-200/85">
            {Object.entries(data.sensorInvalidByHandle).map(
              ([handle, reason]) => (
                <div key={handle}>
                  {handle}: {reason}
                </div>
              ),
            )}
          </div>
        ) : null}

        {!utilityBodyFitsContent ? (
        <FlowNodeBody
          className={
            flowBodyFlexCol
              ? isPlotterNodeId(data.nodeId)
                ? "flex min-h-0 flex-1 flex-col px-0 pb-0 pt-0"
                : "flex min-h-0 flex-1 flex-col"
              : "space-y-0"
          }
        >
          {data.nodeId === "vector-splitter" &&
          data.liveNumberByHandle != null ? (
            <ReadingPanel>
              <ReadingLabel className="mb-1 block">Scalars</ReadingLabel>
              <Vec3ReadingRow
                vector={{
                  x: data.liveNumberByHandle.x ?? Number.NaN,
                  y: data.liveNumberByHandle.y ?? Number.NaN,
                  z: data.liveNumberByHandle.z ?? Number.NaN,
                }}
                fractionDigits={3}
              />
            </ReadingPanel>
          ) : null}
          {data.nodeId === "quaternion-splitter" &&
          data.liveNumberByHandle != null ? (
            <ReadingPanel>
              <ReadingLabel className="mb-1 block">Scalars</ReadingLabel>
              <QuaternionScalarsGrid
                w={data.liveNumberByHandle.w}
                x={data.liveNumberByHandle.x}
                y={data.liveNumberByHandle.y}
                z={data.liveNumberByHandle.z}
                fractionDigits={3}
              />
            </ReadingPanel>
          ) : null}
          {data.nodeId === "quat-input" && data.liveQuaternionWire != null ? (
            <ReadingPanel>
              <ReadingLabel className="mb-1 block">Quaternion</ReadingLabel>
              <QuaternionScalarsGrid
                w={data.liveQuaternionWire.w}
                x={data.liveQuaternionWire.x}
                y={data.liveQuaternionWire.y}
                z={data.liveQuaternionWire.z}
                fractionDigits={3}
              />
            </ReadingPanel>
          ) : null}
          {data.nodeId === "rotation-3d-euler" ? (
            <RotationPreviewPanelV4
              title="3D Scene (Euler)"
              sceneProps={
                eulerScene ?? {
                  qw: 1,
                  qx: 0,
                  qy: 0,
                  qz: 0,
                  fusionEulerHundredths: {
                    roll: 0,
                    pitch: 0,
                    heading: 0,
                  },
                  meshOrientationFromEulerFallback: false,
                  eulerOnly: true,
                  showGrid: rotationShowGrid,
                  scene3d: scene3dForPreview,
                  ...rotationGlbSceneProps,
                }
              }
            />
          ) : null}
          {data.nodeId === "rotation-3d-quaternion" ? (
            <RotationPreviewPanelV4
              title="3D Scene (Quaternion)"
              sceneProps={
                quaternionScene ?? {
                  qw: 1,
                  qx: 0,
                  qy: 0,
                  qz: 0,
                  fusionEulerHundredths: null,
                  meshOrientationFromEulerFallback: false,
                  showGrid: rotationShowGrid,
                  scene3d: scene3dForPreview,
                  ...rotationGlbSceneProps,
                }
              }
            />
          ) : null}
          {data.nodeId === "model-select" ? (
            <ModelSelectNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "boolean-constant" ? (
            <BooleanConstantNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "event-toggle-boolean" ? (
            <EventToggleBooleanNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "on-key" ? (
            <OnKeyNodePanel
              defaultConfig={data.defaultConfig}
              lastFiredAtMs={data.flowEventLastFiredAtMs}
            />
          ) : null}
          {data.nodeId === "on-click" ? (
            <OnClickNodePanel
              defaultConfig={data.defaultConfig}
              lastFiredAtMs={data.flowEventLastFiredAtMs}
            />
          ) : null}
          {data.nodeId === "event-set-boolean" ? (
            <EventSetBooleanNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "event-toggle-glb-part" ? (
            <EventToggleGlbPartNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "event-set-glb-part" ? (
            <EventSetGlbPartNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "event-trigger-glb-anim" ? (
            <EventTriggerGlbAnimNodePanel defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "number-constant" || data.nodeId === "glb-material-param" ? (
            <NumberConstantNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "glb-material-texture" ? (
            <GlbMaterialTextureNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "glb-material-color" ? (
            <GlbMaterialColorNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "math" ? (
            <MathNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "compare" ? (
            <CompareNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "model-viewer" ? (
            <ModelViewerNodePanel
              nodeId={id}
              liveValue={data.liveValue}
              liveEnvironmentWire={data.liveEnvironmentWire}
              liveCameraWire={data.liveCameraWire}
              liveAnimationWire={data.liveAnimationWire}
              liveTransformWire={data.liveTransformWire}
              defaultConfig={data.defaultConfig}
            />
          ) : null}
          {data.nodeId === "environment" && environmentControlsExpanded ? (
            <EnvironmentNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "camera-view" && cameraViewControlsExpanded ? (
            <CameraViewNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
          ) : null}
          {data.nodeId === "indicator" ? (
            <ReadingPanel className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                  indicatorOn ? "bg-emerald-400" : "bg-zinc-500"
                }`}
              />
              <span
                className={indicatorOn ? "text-emerald-300" : "text-zinc-300"}
              >
                {indicatorOn ? "ON" : "OFF"}
              </span>
            </ReadingPanel>
          ) : null}
          {data.nodeId === "gauge" ? (
            <ReadingPanel className="space-y-1.5 text-xs">
              <div className="text-right">
                {typeof data.liveValue === "number" ? (
                  <span className="inline-flex items-baseline justify-end gap-1 font-mono">
                    <ReadingNumber
                      value={data.liveValue}
                      fractionDigits={gaugeDecimals}
                      className="text-zinc-100"
                    />
                    {gaugeUnit.length > 0 ? (
                      <span className="text-zinc-400">{gaugeUnit}</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="font-mono text-zinc-300">—</span>
                )}
              </div>
              <div className="h-2 w-full min-w-24 rounded bg-zinc-700/70">
                <div
                  className="h-2 rounded bg-cyan-400"
                  style={{ width: `${Math.round(gaugeRatio * 100)}%` }}
                />
              </div>
            </ReadingPanel>
          ) : null}
          {data.nodeId === "sparkline" ? (
            <ReadingPanel className="flex min-h-0 w-full max-w-full flex-col p-1">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="block h-10 w-full min-h-10 min-w-40 shrink-0"
              >
                <polyline
                  fill="none"
                  stroke="rgb(34 211 238)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="nonScalingStroke"
                  points={sparkPoints}
                />
              </svg>
            </ReadingPanel>
          ) : null}
          {data.nodeId === "radial-gauge" ? (
            <RadialGaugeNodePanel
              className="relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden flex-1"
              value={typeof data.liveValue === "number" ? data.liveValue : null}
              defaultConfig={data.defaultConfig}
            />
          ) : null}
          {data.nodeId === "bar-meter" ? (
            <BarMeterNodePanel
              className="relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden flex-1"
              value={typeof data.liveValue === "number" ? data.liveValue : null}
              defaultConfig={data.defaultConfig}
            />
          ) : null}
          {data.nodeId === "led-indicator" ? (
            <LedIndicatorNodePanel
              value={data.liveValue}
              defaultConfig={data.defaultConfig}
            />
          ) : null}
          {data.nodeId === "knob" ? (
            <KnobNodePanel
              nodeId={id}
              defaultConfig={data.defaultConfig}
              updateValue={(nid, v) => updateNodeConfigFieldByNodeId(nid, "value", v)}
            />
          ) : null}
          {data.nodeId === "numeric-display" ? (
            <NumericDisplayNodePanel
              value={typeof data.liveValue === "number" ? data.liveValue : null}
              defaultConfig={data.defaultConfig}
            />
          ) : null}
          {isPlotterNodeId(data.nodeId) ? (
            <ReadingPanel className="mt-0 flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none ring-0">
              <PlotterCanvas
                className="relative box-border min-h-0 min-w-0 h-full w-full flex-1 basis-0 overflow-hidden self-stretch"
                histories={data.livePlotHistory ?? {}}
                channelOrder={
                  data.inputHandles?.map((h) => h.id) ?? [...PLOTTER_INPUT_IDS]
                }
                config={coercePlotterConfig(data.defaultConfig)}
              />
            </ReadingPanel>
          ) : null}
          {data.nodeId !== "bmi270-input" &&
          data.nodeId !== "dps368-input" &&
          data.nodeId !== "sht40-input" &&
          data.nodeId !== "bmm350-input" &&
          data.nodeId !== "vector-splitter" &&
          data.nodeId !== "quaternion-splitter" &&
          data.nodeId !== "rotation-3d-euler" &&
          data.nodeId !== "rotation-3d-quaternion" &&
          data.nodeId !== "model-select" &&
          data.nodeId !== "model-viewer" &&
          data.nodeId !== "boolean-constant" &&
          data.nodeId !== "event-toggle-boolean" &&
          data.nodeId !== "on-key" &&
          data.nodeId !== "on-click" &&
          data.nodeId !== "event-set-boolean" &&
          data.nodeId !== "event-toggle-glb-part" &&
          data.nodeId !== "event-set-glb-part" &&
          data.nodeId !== "event-trigger-glb-anim" &&
          data.nodeId !== "number-constant" &&
          data.nodeId !== "glb-material-param" &&
          data.nodeId !== "glb-material-texture" &&
          data.nodeId !== "glb-material-color" &&
          data.nodeId !== "environment" &&
          data.nodeId !== "camera-view" &&
          data.nodeId !== "object-transform" &&
          data.nodeId !== "transform-from-euler" &&
          data.nodeId !== "glb-animation-bundle" &&
          data.nodeId !== "quat-input" &&
          !isStudioSensorTapNodeId(data.nodeId) &&
          data.nodeId !== "indicator" &&
          data.nodeId !== "gauge" &&
          data.nodeId !== "sparkline" &&
          !isPlotterNodeId(data.nodeId) &&
          data.nodeId !== "radial-gauge" &&
          data.nodeId !== "bar-meter" &&
          data.nodeId !== "led-indicator" &&
          data.nodeId !== "knob" &&
          data.nodeId !== "numeric-display" ? (
            <ReadingPanel className="text-right text-xs">
              {typeof data.liveValue === "number" ? (
                <ReadingNumber
                  value={data.liveValue}
                  fractionDigits={4}
                  className="font-mono text-zinc-100"
                />
              ) : (
                <span className="font-mono text-zinc-300">{liveValue}</span>
              )}
            </ReadingPanel>
          ) : null}
        </FlowNodeBody>
        ) : null}
      </FlowNodeShell>
    </div>
  );
}
