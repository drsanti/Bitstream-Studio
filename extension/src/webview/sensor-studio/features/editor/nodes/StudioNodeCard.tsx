import {
  Handle,
  Position,
  useStore,
  useUpdateNodeInternals,
  type NodeProps,
  type Edge,
} from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";
import type { StudioNodeData } from "../store/flow-editor.store";
import {
  STUDIO_FLOW_SENSOR_HEADER_TAG_BY_NODE_ID,
  isStudioAlignedOutputSocketColumnsNodeId,
  isStudioSensorSocketPreviewNodeId,
} from "../store/flow-editor.store";
import { useStudioAssetDescriptors } from "../../asset-browser/useStudioAssetDescriptors";
import { useFlowEditorStore } from "../store/flow-editor.store";
import type { SocketPreviewContext } from "./flow-node/socket-live-preview-for-handle";
import { studioPortAccent } from "./port-accent";
import {
  FlowNodeBody,
  FlowNodeEdgeResize,
  FlowNodeHeader,
  FlowNodeHeaderIcon,
  FlowNodeShell,
  FlowNodeSocketDot,
  FlowNodeSocketRegion,
  FlowNodeSocketRow,
  ReadingPanel,
} from "./flow-node";
import {
  syncFlowNodeHeightFit,
} from "./flow-node/FlowNodeEdgeResize";
import {
  resolveStudioNodeChromeLayoutKey,
} from "./flow-node/studio-node-chrome-layout";
import {
  measureFlowNodeBodyIntrinsicWidth,
  measureFlowNodeHeaderIntrinsicWidth,
  resolveFlowNodeSocketRegionMinWidthPx,
  resolveFlowNodeSocketRegionLabelOnlyWidthPx,
  resolveMaxAutoWidthPx,
} from "./flow-node/flow-node-intrinsic-size";
import {
  socketLivePreviewForInputHandle,
  socketLivePreviewForOutputHandle,
} from "./flow-node/socket-live-preview-for-handle";
import { useFlowCanvasPreferences } from "../context/flow-canvas-preferences-context";
import { flowNodeHandleStyle } from "./flow-node/flow-node-handle-style";
import {
  isFlowHandleWired,
  studioHandleBaseClass,
  studioHandleDimStyle,
} from "./flow-node/flow-node-handle-chrome";
import { FlowNodeHeaderBadge } from "./flow-node/FlowNodeHeaderBadge";
import {
  isBodyControlsVisible,
  isSocketValuesVisible,
  isSocketsExpanded,
  shouldShowSocketRow,
  studioNodeHasHideableBody,
} from "./flow-node/socket-display";
import { studioNodeAllowsBodyCollapse } from "./flow-node/studio-body-collapse";
import { resolveStudioNodeMinDimensionFloor } from "./flow-node/studio-node-resize-defaults";
import { ModelSelectNodePanel } from "./model-nodes/ModelSelectNodePanel";
import { GlbMaterialTextureNodePanel } from "./material/GlbMaterialTextureNodePanel";
import { GlbMaterialColorNodePanel } from "./material/GlbMaterialColorNodePanel";
import { MathNodePanel } from "./math/MathNodePanel";
import {
  CompareNodePanel,
  CompareOperationHeaderChip,
} from "./math/CompareNodePanel";
import { normalizeCompareOperation } from "../../../core/flow/compare-operations";
import { LogicGateNodePanel } from "./math/LogicGateNodePanel";
import { MultiplexerNodePanel } from "./data/MultiplexerNodePanel";
import { GlbAnimationBundleNodePanel } from "./animation/glb-animation-bundle-node-panel";
import { ModelViewerNodePanel } from "./model-nodes/ModelViewerNodePanel";
import { StudioFlowCanvasDisplayScaleProvider } from "./display/studio-canvas-display-scale";
import {
  BooleanConstantNodePanel,
  NumberConstantNodePanel,
} from "./constants/ConstantGeneratorPanels";
import { EnvironmentNodePanel } from "./environment/EnvironmentNodePanel";
import { CameraViewNodePanel } from "./camera-view/CameraViewNodePanel";
import { StudioSceneViewport } from "../../../core/viewport/StudioSceneViewport";
import { PlotterCanvas } from "./plotter/PlotterCanvas";
import { SparklineNodePanel } from "./sparkline/SparklineNodePanel";
import { RadialGaugeNodePanel } from "./radial-gauge/RadialGaugeNodePanel";
import { BarMeterNodePanel } from "./bar-meter/BarMeterNodePanel";
import { LedIndicatorNodePanel } from "./led-indicator/LedIndicatorNodePanel";
import { KnobNodePanel } from "./knob/KnobNodePanel";
import { NumericDisplayNodePanel } from "./numeric-display/NumericDisplayNodePanel";
import {
  AudioFilePlayerNodePanel,
  AudioOscillatorNodePanel,
  AudioOutputNodePanel,
  AudioScopeNodePanel,
  MicInputNodePanel,
} from "./audio/AudioNodePanels";
import {
  coercePlotterConfig,
  isPlotterNodeId,
  PLOTTER_INPUT_IDS,
} from "./plotter/plotter-config";
import { isRotation3DCatalogNodeId } from "./rotation/rotation-3d-node-ids";
import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
} from "../../../core/scene3d/scene3d-config";
import { mergeFlowWireEnvironmentIntoScene3d } from "./environment/flow-wire-environment";
import { mergeFlowWireCameraIntoScene3d } from "./camera-view/flow-wire-camera";
import { mergeFlowWireTransformIntoScene3d } from "./transform/flow-wire-transform";
import { mergeFlowSceneWiresIntoScene3d } from "./scene-fx/merge-flow-scene-wires";
import { buildGlbAnimationPreviewSceneProps } from "../gltf/build-glb-animation-preview-scene-props";
import { buildGlbScalarPreviewSceneProps } from "../gltf/build-glb-scalar-preview-scene-props";
import {
  EventSetBooleanNodePanel,
  EventSetGlbPartNodePanel,
  EventToggleBooleanNodePanel,
  EventToggleGlbPartNodePanel,
  EventTriggerGlbAnimNodePanel,
  OnClickNodePanel,
  OnKeyNodePanel,
} from "./events/EventFlowNodePanels";
import type { RotationPreviewSceneProps } from "../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";

const handleDotClass =
  "relative flex h-6 w-0 items-center justify-center overflow-visible";

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
  const onNodesChange = useFlowEditorStore((s) => s.onNodesChange);
  const syncStudioNodeContentMinDimensions = useFlowEditorStore(
    (s) => s.syncStudioNodeContentMinDimensions,
  );
  const syncStudioNodeWidthFromContentMeasure = useFlowEditorStore(
    (s) => s.syncStudioNodeWidthFromContentMeasure,
  );
  const flowNodeWidth = useFlowEditorStore(
    (s) => s.nodes.find((n) => n.id === id)?.width,
  );
  const flowNodeHeight = useFlowEditorStore(
    (s) => s.nodes.find((n) => n.id === id)?.height,
  );
  const updateNodeInternals = useUpdateNodeInternals();
  const flowZoom = useStore((s) => s.transform[2]);
  const isSelected = Boolean(
    selectedFromRf || selectedInDocument || primarySelectedId === id,
  );
  const { descriptors } = useStudioAssetDescriptors();
  const flowNodes = useFlowEditorStore((s) => s.nodes);
  const flowEdges = useFlowEditorStore((s) => s.edges);
  const canvasPrefs = useFlowCanvasPreferences();
  const handleBaseClass = studioHandleBaseClass(
    canvasPrefs.handleSizePx,
    canvasPrefs.handleBorderWidthPx,
  );

  // Some editor graphs contain layout/reroute nodes that do not have `data.nodeId/defaultConfig`.
  // Downstream preview helpers expect only "catalog-backed" studio nodes.
  const flowNodesWithCatalogData = useMemo(
    () =>
      flowNodes.filter(
        (n): n is typeof n & { data: { nodeId: string; defaultConfig: Record<string, unknown> } } =>
          typeof (n as any)?.data?.nodeId === "string" &&
          (n as any)?.data?.defaultConfig != null,
      ),
    [flowNodes],
  );

  const onNodesChangeAny = useCallback(
    (changes: any[]) => {
      (onNodesChange as unknown as (c: any[]) => void)(changes);
    },
    [onNodesChange],
  );
  const socketPreviewCtx = useMemo<SocketPreviewContext>(
    () => ({
      flowNodeId: id,
      descriptors,
      flowNodes: flowNodesWithCatalogData as any,
      flowEdges,
    }),
    [id, descriptors, flowNodesWithCatalogData, flowEdges],
  );
  const socketsExpanded = isSocketsExpanded(data.ui);
  const socketValuesVisible = isSocketValuesVisible(data.ui);
  const bodyControlsVisible = isBodyControlsVisible(data.ui);
  const edges = flowEdges as unknown as readonly Edge[];

  const mergeHandleStyle = useCallback(
    (
      side: "left" | "right",
      accent: string,
      handleId: string,
      handleType: "source" | "target",
    ) => {
      const dimmed =
        canvasPrefs.handleDimWhenUnwired &&
        !isFlowHandleWired({
          nodeId: id,
          handleId,
          handleType,
          edges,
        });
      return {
        ...flowNodeHandleStyle(side, accent),
        ...studioHandleDimStyle(dimmed),
      };
    },
    [canvasPrefs.handleDimWhenUnwired, edges, id],
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
  const sparklineBars = (data.liveHistory ?? []).slice(-24);
  const indicatorOn = data.nodeId === "indicator" && data.liveValue === true;

  /** Hide `sim` — only surfaced when hardware stream is absent (no extra pill). */
  const sensorHealthBadge =
    data.sensorHealth != null && data.sensorHealth !== "sim" ? (
      <FlowNodeHeaderBadge
        tone={
          data.sensorHealth === "live"
            ? "live"
            : data.sensorHealth === "stale"
              ? "stale"
              : data.sensorHealth === "offline"
                ? "offline"
                : "neutral"
        }
        pulseDot={data.sensorHealth === "live"}
      >
        {data.sensorHealth}
      </FlowNodeHeaderBadge>
    ) : null;

  const invalidBadge = hasInvalid ? (
    <FlowNodeHeaderBadge tone="invalid">Invalid</FlowNodeHeaderBadge>
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
  const sensorFamilyTag = showSensorFamilyTag ? (
    <FlowNodeHeaderBadge tone="family">{sensorFamilyTagLabel}</FlowNodeHeaderBadge>
  ) : null;

  const compareOperation =
    data.nodeId === "compare" &&
    typeof data.defaultConfig.operation === "string"
      ? normalizeCompareOperation(data.defaultConfig.operation)
      : null;

  const utilityBodyFitsContent =
    data.nodeId === "object-transform" ||
    data.nodeId === "transform-from-euler" ||
    data.nodeId === "on-key" ||
    data.nodeId === "on-click" ||
    data.nodeId === "event-toggle-boolean" ||
    data.nodeId === "event-set-boolean" ||
    data.nodeId === "event-toggle-glb-part" ||
    data.nodeId === "event-set-glb-part" ||
    data.nodeId === "event-trigger-glb-anim" ||
    data.nodeId === "glb-animation-bundle" ||
    isStudioSensorSocketPreviewNodeId(data.nodeId);

  const canCollapseBody = studioNodeAllowsBodyCollapse(data);
  const showNodeBody =
    studioNodeHasHideableBody(data) &&
    (!canCollapseBody || bodyControlsVisible);
  const compactConfigBodyNode =
    data.nodeId === "compare" ||
    data.nodeId === "logic-gate" ||
    data.nodeId === "map-range" ||
    data.nodeId === "clamp" ||
    data.nodeId === "multiplexer";
  const shellFitsContent =
    utilityBodyFitsContent ||
    !showNodeBody ||
    (showNodeBody && compactConfigBodyNode);

  const headerChromeKey = useMemo(
    () =>
      [
        data.label,
        data.sensorHealth ?? "",
        hasInvalid ? "1" : "0",
        showSensorFamilyTag ? (sensorFamilyTagLabel ?? "") : "",
        compareOperation ?? "",
        showNodeBody ? "body" : "compact",
      ].join("\0"),
    [
      data.label,
      data.sensorHealth,
      hasInvalid,
      showSensorFamilyTag,
      sensorFamilyTagLabel,
      compareOperation,
      showNodeBody,
    ],
  );

  const nodeResizable = data.ui?.resizable === true;
  const minDimensionFloor = resolveStudioNodeMinDimensionFloor(data.nodeId);
  const minNodeWidth =
    typeof data.ui?.minWidth === "number" && Number.isFinite(data.ui.minWidth)
      ? Math.round(data.ui.minWidth)
      : minDimensionFloor.minWidth;
  const minNodeHeight =
    typeof data.ui?.minHeight === "number" && Number.isFinite(data.ui.minHeight)
      ? Math.round(data.ui.minHeight)
      : minDimensionFloor.minHeight;

  const hasHideableBody = studioNodeHasHideableBody(data);
  const chromeLayoutKey = useMemo(
    () => resolveStudioNodeChromeLayoutKey(data.ui, hasHideableBody),
    [data.ui, hasHideableBody],
  );
  const lastAutoFitChromeLayoutKeyRef = useRef<string | null>(null);
  const chromeLayoutKeyRef = useRef(chromeLayoutKey);
  const socketValuesVisibleRef = useRef(socketValuesVisible);
  const flowNodeWidthRef = useRef(flowNodeWidth);
  chromeLayoutKeyRef.current = chromeLayoutKey;
  socketValuesVisibleRef.current = socketValuesVisible;
  flowNodeWidthRef.current = flowNodeWidth;

  useLayoutEffect(() => {
    lastAutoFitChromeLayoutKeyRef.current = null;
  }, [socketValuesVisible, socketsExpanded, bodyControlsVisible, showNodeBody]);

  const headerMeasureRef = useRef<HTMLDivElement | null>(null);
  const socketsMeasureRef = useRef<HTMLDivElement | null>(null);
  const bodyMeasureRef = useRef<HTMLDivElement | null>(null);
  const measureContentSizeRef = useRef<(() => void) | null>(null);
  const lastSyncedWidthRef = useRef<number | null>(null);
  const [measuredHeaderSocketsMinHeight, setMeasuredHeaderSocketsMinHeight] =
    useState<number | null>(null);
  const [measuredHeaderSocketsMinWidth, setMeasuredHeaderSocketsMinWidth] =
    useState<number | null>(null);

  useLayoutEffect(() => {
    const headerEl = headerMeasureRef.current;
    const socketsEl = socketsMeasureRef.current;
    if (headerEl == null) {
      return;
    }
    const maxAutoWidthPx = resolveMaxAutoWidthPx(data.nodeId, minNodeWidth);
    const measure = () => {
      const headerH = headerEl.offsetHeight;
      const socketsH = socketsEl?.offsetHeight ?? 0;
      const bodyEl = bodyMeasureRef.current;
      const bodyH = bodyEl?.offsetHeight ?? 0;
      const next = Math.max(0, Math.ceil(headerH + socketsH + bodyH));
      setMeasuredHeaderSocketsMinHeight((prev) =>
        prev === next ? prev : next,
      );

      const SPARE_PX = 14;
      const liveValuesHidden = !socketValuesVisibleRef.current;
      const socketsIntrinsicW =
        socketsEl != null
          ? liveValuesHidden
            ? resolveFlowNodeSocketRegionLabelOnlyWidthPx(socketsEl)
            : resolveFlowNodeSocketRegionMinWidthPx(socketsEl)
          : 0;
      const headerIntrinsicW = measureFlowNodeHeaderIntrinsicWidth(headerEl);
      const bodyIntrinsicW =
        bodyEl != null ? measureFlowNodeBodyIntrinsicWidth(bodyEl) : 0;
      let nextW = Math.max(
        0,
        Math.ceil(
          Math.max(headerIntrinsicW, socketsIntrinsicW, bodyIntrinsicW) + SPARE_PX,
        ),
      );
      if (maxAutoWidthPx != null) {
        nextW = Math.min(nextW, maxAutoWidthPx);
      }
      setMeasuredHeaderSocketsMinWidth((prev) =>
        prev === nextW ? prev : nextW,
      );

      const key = chromeLayoutKeyRef.current;
      const fitW = Math.max(minNodeWidth, nextW);
      const currentW = flowNodeWidthRef.current;
      const roundedCurrentW =
        typeof currentW === "number" && Number.isFinite(currentW) && currentW > 0
          ? Math.round(currentW)
          : null;
      const modeChanged = lastAutoFitChromeLayoutKeyRef.current !== key;

      const syncWidth = (nextFitW: number) => {
        syncStudioNodeWidthFromContentMeasure(id, nextFitW);
        flowNodeWidthRef.current = nextFitW;
        if (lastSyncedWidthRef.current !== nextFitW) {
          lastSyncedWidthRef.current = nextFitW;
          queueMicrotask(() => updateNodeInternals(id));
        }
      };

      if (nodeResizable) {
        const widthStripped = roundedCurrentW == null;
        const needsGrow =
          roundedCurrentW != null && fitW > roundedCurrentW;
        if (modeChanged || widthStripped || needsGrow) {
          if (modeChanged) {
            lastAutoFitChromeLayoutKeyRef.current = key;
          }
          syncWidth(fitW);
        }
      } else {
        if (modeChanged) {
          lastAutoFitChromeLayoutKeyRef.current = key;
        }
        if (roundedCurrentW !== fitW) {
          syncWidth(fitW);
        }
      }
    };
    measureContentSizeRef.current = measure;
    const measureAndSyncAfterLayout = () => {
      measure();
      requestAnimationFrame(measure);
    };
    const bodyEl = bodyMeasureRef.current;
    measureAndSyncAfterLayout();
    const ro = new ResizeObserver(measureAndSyncAfterLayout);
    ro.observe(headerEl);
    if (socketsEl != null) {
      ro.observe(socketsEl);
    }
    if (bodyEl != null) {
      ro.observe(bodyEl);
    }
    const headerMeasureRoot = headerEl.querySelector<HTMLElement>(
      "[data-flow-node-header-measure]",
    );
    const headerMo =
      headerMeasureRoot != null
        ? new MutationObserver(measureAndSyncAfterLayout)
        : null;
    if (headerMeasureRoot != null && headerMo != null) {
      headerMo.observe(headerMeasureRoot, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    return () => {
      ro.disconnect();
      headerMo?.disconnect();
      if (measureContentSizeRef.current === measure) {
        measureContentSizeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Socket rows / visibility changes that can affect required minimum height.
    socketsExpanded,
    socketValuesVisible,
    showNodeBody,
    bodyControlsVisible,
    data.nodeId,
    data.label,
    data.sensorHealth,
    data.sensorInvalidReason,
    data.sensorInvalidByHandle,
    data.inputHandles?.length,
    data.outputHandles?.length,
    data.inputType,
    data.outputType,
    data.defaultConfig,
    chromeLayoutKey,
    id,
    minNodeWidth,
    nodeResizable,
    headerChromeKey,
    syncStudioNodeWidthFromContentMeasure,
    updateNodeInternals,
  ]);

  useLayoutEffect(() => {
    const runMeasure = measureContentSizeRef.current;
    if (runMeasure == null) {
      return;
    }
    runMeasure();
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      runMeasure();
      innerFrame = requestAnimationFrame(runMeasure);
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [headerChromeKey, id]);

  const mathOperation =
    data.nodeId === "math" && typeof data.defaultConfig.operation === "string"
      ? data.defaultConfig.operation
      : null;
  const logicGateOperation =
    data.nodeId === "logic-gate" &&
    typeof data.defaultConfig.operation === "string"
      ? data.defaultConfig.operation
      : null;

  useLayoutEffect(() => {
    if (
      data.nodeId === "camera-view" ||
      data.nodeId === "environment" ||
      data.nodeId === "math" ||
      data.nodeId === "logic-gate"
    ) {
      updateNodeInternals(id);
    }
  }, [
    id,
    data.nodeId,
    mathOperation,
    logicGateOperation,
    data.inputHandles?.length,
    bodyControlsVisible,
    showNodeBody,
    updateNodeInternals,
  ]);

  useLayoutEffect(() => {
    updateNodeInternals(id);
  }, [id, socketValuesVisible, socketsExpanded, updateNodeInternals]);

  const compareOperationChip =
    compareOperation != null && !showNodeBody ? (
      <CompareOperationHeaderChip operation={compareOperation} />
    ) : null;

  const headerLeading = (
    <FlowNodeHeaderIcon nodeId={data.nodeId} category={data.category} />
  );

  const headerTrailing =
    compareOperationChip != null ||
    sensorHealthBadge != null ||
    invalidBadge != null ||
    sensorFamilyTag != null ? (
      <>
        {compareOperationChip}
        {sensorFamilyTag}
        {invalidBadge}
        {sensorHealthBadge}
      </>
    ) : null;

  const hasSocketRegion =
    data.inputType != null ||
    (data.inputHandles != null && data.inputHandles.length > 0) ||
    data.outputType != null ||
    (data.outputHandles != null && data.outputHandles.length > 0);

  const effectiveMinNodeWidth = Math.max(
    minNodeWidth,
    measuredHeaderSocketsMinWidth ?? 0,
  );
  const effectiveMinNodeHeight = Math.max(
    minNodeHeight,
    measuredHeaderSocketsMinHeight ?? 0,
  );

  useEffect(() => {
    syncStudioNodeContentMinDimensions(
      id,
      effectiveMinNodeWidth,
      effectiveMinNodeHeight,
    );
  }, [
    id,
    effectiveMinNodeWidth,
    effectiveMinNodeHeight,
    syncStudioNodeContentMinDimensions,
  ]);

  const visibleInputHandles = (() => {
    if (data.inputHandles != null && data.inputHandles.length > 0) {
      const filtered = data.inputHandles.filter((h) =>
        shouldShowSocketRow(
          id,
          h.id,
          edges,
          "input",
          socketsExpanded,
          data.inputHandles,
        ),
      );
      // New rule: a node must show at least one socket; single-socket nodes keep their only socket even if unwired.
      if (
        !socketsExpanded &&
        filtered.length === 0 &&
        data.inputHandles.length === 1
      ) {
        return data.inputHandles;
      }
      return filtered;
    }
    return null;
  })();

  const inputSockets: ReactNode[] =
    visibleInputHandles != null
      ? visibleInputHandles.map((h) => {
          const preview = socketLivePreviewForInputHandle(
            data,
            h.id,
            h.portType,
            h.label,
            socketPreviewCtx,
          );
          return (
            <FlowNodeSocketRow
              key={h.id}
              variant="input"
              alignedInputColumns
              label={h.label}
              trailingPreview={preview ?? undefined}
              socket={
                <FlowNodeSocketDot className={handleDotClass}>
                  <Handle
                    id={h.id}
                    type="target"
                    position={Position.Left}
                    className={handleBaseClass}
                    style={mergeHandleStyle(
                      "left",
                      studioPortAccent(h.portType),
                      h.id,
                      "target",
                    )}
                  />
                </FlowNodeSocketDot>
              }
            />
          );
        })
      : data.inputType != null
        ? (() => {
            // New rule: a node must show at least one socket; keep the single `in` handle visible even if unwired.
            const showRow =
              socketsExpanded ||
              shouldShowSocketRow(id, "in", edges, "input", socketsExpanded, [
                { id: "in", portType: data.inputType, label: "In" },
              ]);
            if (!showRow) return [];
            const preview = socketLivePreviewForInputHandle(
              data,
              "in",
              data.inputType,
              undefined,
              socketPreviewCtx,
            );
            return [
              <FlowNodeSocketRow
                key="in"
                variant="input"
                alignedInputColumns
                label="In"
                trailingPreview={preview ?? undefined}
                socket={
                  <FlowNodeSocketDot className={handleDotClass}>
                    <Handle
                      id="in"
                      type="target"
                      position={Position.Left}
                      className={handleBaseClass}
                      style={mergeHandleStyle(
                        "left",
                        studioPortAccent(data.inputType),
                        "in",
                        "target",
                      )}
                    />
                  </FlowNodeSocketDot>
                }
              />,
            ];
          })()
        : [];

  const alignedOutputSocketColumns = isStudioAlignedOutputSocketColumnsNodeId(
    data.nodeId,
  );

  const visibleOutputHandles = (() => {
    if (data.outputHandles != null && data.outputHandles.length > 0) {
      const filtered = data.outputHandles.filter((h) =>
        shouldShowSocketRow(id, h.id, edges, "output", socketsExpanded),
      );
      // New rule: a node must show at least one socket; single-socket nodes keep their only socket even if unwired.
      if (
        !socketsExpanded &&
        filtered.length === 0 &&
        data.outputHandles.length === 1
      ) {
        return data.outputHandles;
      }
      return filtered;
    }
    return null;
  })();

  const outputSockets =
    visibleOutputHandles != null
      ? visibleOutputHandles.map((h) => {
          const preview = socketLivePreviewForOutputHandle(
            data,
            h.id,
            h.portType,
            h.label,
            socketPreviewCtx,
          );
          return (
            <FlowNodeSocketRow
              key={h.id}
              variant="output"
              alignedOutputColumns={alignedOutputSocketColumns}
              leadingPreview={preview ?? undefined}
              label={h.label}
              socket={
                <FlowNodeSocketDot className={handleDotClass}>
                  <Handle
                    id={h.id}
                    type="source"
                    position={Position.Right}
                    className={handleBaseClass}
                    style={mergeHandleStyle(
                      "right",
                      studioPortAccent(h.portType),
                      h.id,
                      "source",
                    )}
                  />
                </FlowNodeSocketDot>
              }
            />
          );
        })
      : data.outputType != null
        ? (() => {
            // New rule: a node must show at least one socket; keep the single `out` handle visible even if unwired.
            const showRow =
              socketsExpanded ||
              shouldShowSocketRow(id, "out", edges, "output", socketsExpanded);
            if (!showRow) return [];
            const preview = socketLivePreviewForOutputHandle(
              data,
              "out",
              data.outputType,
              undefined,
              socketPreviewCtx,
            );
            return [
              <FlowNodeSocketRow
                key="out"
                variant="output"
                leadingPreview={preview ?? undefined}
                label="Out"
                socket={
                  <FlowNodeSocketDot className={handleDotClass}>
                    <Handle
                      id="out"
                      type="source"
                      position={Position.Right}
                      className={handleBaseClass}
                      style={mergeHandleStyle(
                        "right",
                        studioPortAccent(data.outputType),
                        "out",
                        "source",
                      )}
                    />
                  </FlowNodeSocketDot>
                }
              />,
            ];
          })()
        : [];

  // New rule: collapsed mode should never hide *all* sockets.
  if (
    !socketsExpanded &&
    inputSockets.length === 0 &&
    outputSockets.length === 0
  ) {
    if (data.inputHandles != null && data.inputHandles.length > 0) {
      const h = data.inputHandles[0];
      const preview = socketLivePreviewForInputHandle(
        data,
        h.id,
        h.portType,
        h.label,
        socketPreviewCtx,
      );
      inputSockets.push(
        <FlowNodeSocketRow
          key={h.id}
          variant="input"
          alignedInputColumns
          label={h.label}
          trailingPreview={preview ?? undefined}
          socket={
            <FlowNodeSocketDot className={handleDotClass}>
              <Handle
                id={h.id}
                type="target"
                position={Position.Left}
                className={handleBaseClass}
                style={mergeHandleStyle(
                  "left",
                  studioPortAccent(h.portType),
                  h.id,
                  "target",
                )}
              />
            </FlowNodeSocketDot>
          }
        />,
      );
    } else if (data.inputType != null) {
      const preview = socketLivePreviewForInputHandle(
        data,
        "in",
        data.inputType,
        undefined,
        socketPreviewCtx,
      );
      inputSockets.push(
        <FlowNodeSocketRow
          key="in"
          variant="input"
          alignedInputColumns
          label="In"
          trailingPreview={preview ?? undefined}
          socket={
            <FlowNodeSocketDot className={handleDotClass}>
              <Handle
                id="in"
                type="target"
                position={Position.Left}
                className={handleBaseClass}
                style={mergeHandleStyle(
                  "left",
                  studioPortAccent(data.inputType),
                  "in",
                  "target",
                )}
              />
            </FlowNodeSocketDot>
          }
        />,
      );
    } else if (data.outputHandles != null && data.outputHandles.length > 0) {
      const h = data.outputHandles[0];
      const preview = socketLivePreviewForOutputHandle(
        data,
        h.id,
        h.portType,
        h.label,
        socketPreviewCtx,
      );
      outputSockets.push(
        <FlowNodeSocketRow
          key={h.id}
          variant="output"
          alignedOutputColumns={alignedOutputSocketColumns}
          leadingPreview={preview ?? undefined}
          label={h.label}
          socket={
            <FlowNodeSocketDot className={handleDotClass}>
              <Handle
                id={h.id}
                type="source"
                position={Position.Right}
                className={handleBaseClass}
                style={mergeHandleStyle(
                  "right",
                  studioPortAccent(h.portType),
                  h.id,
                  "source",
                )}
              />
            </FlowNodeSocketDot>
          }
        />,
      );
    } else if (data.outputType != null) {
      const preview = socketLivePreviewForOutputHandle(
        data,
        "out",
        data.outputType,
        undefined,
        socketPreviewCtx,
      );
      outputSockets.push(
        <FlowNodeSocketRow
          key="out"
          variant="output"
          leadingPreview={preview ?? undefined}
          label="Out"
          socket={
            <FlowNodeSocketDot className={handleDotClass}>
              <Handle
                id="out"
                type="source"
                position={Position.Right}
                className={handleBaseClass}
                style={mergeHandleStyle(
                  "right",
                  studioPortAccent(data.outputType),
                  "out",
                  "source",
                )}
              />
            </FlowNodeSocketDot>
          }
        />,
      );
    }
  }

  const rotationShowGrid =
    typeof data.defaultConfig.showGrid === "boolean"
      ? data.defaultConfig.showGrid
      : true;

  const isRotation3dNode = isRotation3DCatalogNodeId(data.nodeId);

  type RotationPreviewScenePropsV4 = RotationPreviewSceneProps & {
    scene3d?: unknown;
  };
  const scene3d =
    data.defaultConfig.scene3d != null
      ? coerceScene3DConfigV1(data.defaultConfig.scene3d)
      : defaultScene3DConfig();

  const scene3dForPreview = useMemo(
    () =>
      mergeFlowSceneWiresIntoScene3d(
        mergeFlowWireTransformIntoScene3d(
          mergeFlowWireCameraIntoScene3d(
            mergeFlowWireEnvironmentIntoScene3d(
              scene3d,
              data.liveEnvironmentWire ?? null,
            ),
            data.liveCameraWire ?? null,
          ),
          data.liveTransformWire ?? null,
        ),
        {
          fog: data.liveFogWire ?? null,
          exposure: data.liveSettingsExposure ?? null,
          studioLight: data.liveStudioLightWire ?? null,
          postProcessing: data.livePostProcessingWire ?? null,
          contactShadows: data.liveContactShadowsWire ?? null,
          particleEmitter: data.liveParticleEmitterWire ?? null,
        },
      ),
    [
      scene3d,
      data.liveEnvironmentWire,
      data.liveCameraWire,
      data.liveTransformWire,
      data.liveFogWire,
      data.liveSettingsExposure,
      data.liveStudioLightWire,
      data.livePostProcessingWire,
      data.liveContactShadowsWire,
      data.liveParticleEmitterWire,
    ],
  );

  const rotationGlbSceneProps = useMemo(
    () =>
      isRotation3dNode
        ? {
            ...buildGlbScalarPreviewSceneProps({
              nodes: flowNodesWithCatalogData as any,
              edges: flowEdges,
              flowNodeId: id,
              catalogNodeId: data.nodeId,
              defaultConfig: data.defaultConfig,
              liveStudioLightWire: data.liveStudioLightWire ?? null,
            }),
            ...buildGlbAnimationPreviewSceneProps({
              nodes: flowNodesWithCatalogData as any,
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
      data.liveStudioLightWire,
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
  const flowNodeShellRef = useRef<HTMLDivElement | null>(null);
  const resizeActive = isSelected && nodeResizable;
  useLayoutEffect(() => {
    if (nodeResizable) {
      return;
    }
    let frame = 0;
    frame = requestAnimationFrame(() => {
      const shellEl = shellRef.current;
      let targetH = effectiveMinNodeHeight;
      if (shellEl != null && !shellFitsContent) {
        targetH = Math.max(targetH, Math.round(shellEl.offsetHeight));
      }
      const currentW =
        typeof flowNodeWidth === "number" && flowNodeWidth > 0
          ? flowNodeWidth
          : effectiveMinNodeWidth;
      syncFlowNodeHeightFit(
        id,
        targetH,
        onNodesChangeAny,
        currentW,
        flowNodeHeight,
      );
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    nodeResizable,
    showNodeBody,
    shellFitsContent,
    socketValuesVisible,
    socketsExpanded,
    bodyControlsVisible,
    id,
    effectiveMinNodeHeight,
    flowNodeWidth,
    flowNodeHeight,
    onNodesChange,
    visibleInputHandles?.length ?? 0,
    visibleOutputHandles?.length ?? 0,
    inputSockets.length,
    outputSockets.length,
    edges.length,
  ]);

  return (
    <StudioFlowCanvasDisplayScaleProvider value={flowZoom}>
      <div
        ref={shellRef}
        className={`relative w-full min-w-0 max-w-full ${shellFitsContent ? "h-auto" : "h-full"}`}
      >
        <FlowNodeEdgeResize
          nodeId={id}
          active={resizeActive}
          minWidth={effectiveMinNodeWidth}
          minHeight={effectiveMinNodeHeight}
          shellRef={shellRef}
        />
        <FlowNodeShell
          ref={flowNodeShellRef}
          glass
          glassPreset="medium"
          style={{
            width: "100%",
            height: shellFitsContent ? "auto" : "100%",
          }}
          className={[
            "relative transition-shadow duration-150",
            isSelected ? "studio-flow-node--selected" : null,
            isPlotterNodeId(data.nodeId) ||
            data.nodeId === "model-select" ||
            data.nodeId === "model-viewer" ||
            data.nodeId === "radial-gauge" ||
            data.nodeId === "bar-meter" ||
            data.nodeId === "knob"
              ? "min-h-0"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <FlowNodeHeader
            ref={headerMeasureRef}
            glass
            glassPreset="medium"
            className="studio-node-drag-handle cursor-move"
            leading={headerLeading}
            primary={data.label}
            trailing={headerTrailing}
          />

          {hasSocketRegion ? (
            <div
              ref={socketsMeasureRef}
              className={twMerge(
                "nodrag min-w-0 w-full max-w-full overflow-visible py-1.5 pl-0 pr-0",
                isPlotterNodeId(data.nodeId) ? "pb-0 pt-1.5" : null,
              )}
            >
              {inputSockets.length > 0 ? (
                <FlowNodeSocketRegion
                  equalizeLabelWidth={socketValuesVisible}
                  showLivePreviewColumn={socketValuesVisible}
                  className={twMerge(
                    "grid gap-x-1 gap-y-0.5",
                    socketValuesVisible
                      ? "grid-cols-[0_max-content_max-content]"
                      : "grid-cols-[0_max-content_0]",
                  )}
                >
                  {inputSockets}
                </FlowNodeSocketRegion>
              ) : null}
              {outputSockets.length > 0 ? (
                <FlowNodeSocketRegion
                  alignedOutputColumns={alignedOutputSocketColumns}
                  equalizeLabelWidth={socketValuesVisible}
                  showLivePreviewColumn={socketValuesVisible}
                  alignRowsToEnd={!alignedOutputSocketColumns}
                  className="w-full max-w-full"
                >
                  {outputSockets}
                </FlowNodeSocketRegion>
              ) : null}
            </div>
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

          {showNodeBody ? (
            <div
              ref={nodeResizable ? bodyMeasureRef : undefined}
              className="min-w-0 w-full max-w-full overflow-hidden"
            >
            <FlowNodeBody
              className={
                compactConfigBodyNode
                  ? "px-0 pb-0 pt-0"
                  : flowBodyFlexCol
                    ? isPlotterNodeId(data.nodeId)
                      ? "flex min-h-0 flex-1 flex-col px-0 pb-0 pt-0"
                      : "flex min-h-0 flex-1 flex-col"
                    : "space-y-0"
              }
            >
              {data.nodeId === "rotation-3d-euler" ? (
                <StudioSceneViewport
                  title="3D Scene (Euler)"
                  previewScopeId={`flow-node:${id}`}
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
                <StudioSceneViewport
                  title="3D Scene (Quaternion)"
                  previewScopeId={`flow-node:${id}`}
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
                <ModelSelectNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "mic-input" ? (
                <MicInputNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "audio-output" ? (
                <AudioOutputNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "audio-scope" ? (
                <AudioScopeNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "audio-file-player" ? (
                <AudioFilePlayerNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "audio-oscillator" ? (
                <AudioOscillatorNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "boolean-constant" ? (
                <BooleanConstantNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "event-toggle-boolean" ? (
                <EventToggleBooleanNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
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
                <EventSetBooleanNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "event-toggle-glb-part" ? (
                <EventToggleGlbPartNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "event-set-glb-part" ? (
                <EventSetGlbPartNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "event-trigger-glb-anim" ? (
                <EventTriggerGlbAnimNodePanel
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "number-constant" ||
              data.nodeId === "float-constant" ||
              data.nodeId === "integer-constant" ||
              data.nodeId === "glb-material-param" ? (
                <NumberConstantNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "glb-material-texture" ? (
                <GlbMaterialTextureNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "glb-material-color" ? (
                <GlbMaterialColorNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "math" ? (
                <MathNodePanel nodeId={id} defaultConfig={data.defaultConfig} />
              ) : null}
              {data.nodeId === "compare" ? (
                <CompareNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "logic-gate" ? (
                <LogicGateNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "multiplexer" ? (
                <MultiplexerNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {/* Map Range has no body panel — values and defaults are displayed on socket rows. */}
              {/* Clamp has no body panel — Min/Max are displayed on socket rows. */}
              {data.nodeId === "glb-animation-bundle" ? (
                <GlbAnimationBundleNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "model-viewer" ? (
                <ModelViewerNodePanel
                  nodeId={id}
                  liveValue={data.liveValue}
                  liveEnvironmentWire={data.liveEnvironmentWire}
                  liveCameraWire={data.liveCameraWire}
                  liveAnimationWire={data.liveAnimationWire}
                  liveTransformWire={data.liveTransformWire}
                  liveFogWire={data.liveFogWire}
                  liveSettingsExposure={data.liveSettingsExposure ?? null}
                  liveStudioLightWire={data.liveStudioLightWire}
                  livePostProcessingWire={data.livePostProcessingWire}
                  liveContactShadowsWire={data.liveContactShadowsWire}
                  liveParticleEmitterWire={data.liveParticleEmitterWire}
                  livePhysicsWire={data.livePhysicsWire}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "environment" ? (
                <EnvironmentNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "camera-view" ? (
                <CameraViewNodePanel
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                />
              ) : null}
              {data.nodeId === "indicator" ? (
                <ReadingPanel className="flex items-center gap-2 text-xs">
                  <span
                    className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                      indicatorOn ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
                  />
                  <span
                    className={
                      indicatorOn ? "text-emerald-300" : "text-zinc-300"
                    }
                  >
                    {indicatorOn ? "ON" : "OFF"}
                  </span>
                </ReadingPanel>
              ) : null}
              {data.nodeId === "sparkline" ? (
                <ReadingPanel className="flex min-h-0 w-full max-w-full flex-col p-0">
                  <SparklineNodePanel
                    className="p-1"
                    history={data.liveHistory ?? sparklineBars}
                    defaultConfig={data.defaultConfig}
                    sensorHealth={data.sensorHealth}
                  />
                </ReadingPanel>
              ) : null}
              {data.nodeId === "radial-gauge" ? (
                <RadialGaugeNodePanel
                  className="relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden flex-1"
                  value={
                    typeof data.liveValue === "number" ? data.liveValue : null
                  }
                  defaultConfig={data.defaultConfig}
                  sensorHealth={data.sensorHealth}
                />
              ) : null}
              {data.nodeId === "bar-meter" ? (
                <BarMeterNodePanel
                  className="relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden flex-1"
                  value={
                    typeof data.liveValue === "number" ? data.liveValue : null
                  }
                  defaultConfig={data.defaultConfig}
                  sensorHealth={data.sensorHealth}
                />
              ) : null}
              {data.nodeId === "led-indicator" ? (
                <LedIndicatorNodePanel
                  value={data.liveValue}
                  defaultConfig={data.defaultConfig}
                  sensorHealth={data.sensorHealth}
                />
              ) : null}
              {data.nodeId === "knob" ? (
                <KnobNodePanel
                  className="relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden flex-1"
                  nodeId={id}
                  defaultConfig={data.defaultConfig}
                  updateValue={(nid, v) =>
                    updateNodeConfigFieldByNodeId(nid, "value", v)
                  }
                />
              ) : null}
              {data.nodeId === "numeric-display" ? (
                <NumericDisplayNodePanel
                  value={
                    typeof data.liveValue === "number" ? data.liveValue : null
                  }
                  defaultConfig={data.defaultConfig}
                  sensorHealth={data.sensorHealth}
                />
              ) : null}
              {isPlotterNodeId(data.nodeId) ? (
                <ReadingPanel className="mt-0 flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none ring-0">
                  <PlotterCanvas
                    className="relative box-border min-h-0 min-w-0 h-full w-full flex-1 basis-0 overflow-hidden self-stretch"
                    histories={data.livePlotHistory ?? {}}
                    channelOrder={
                      data.inputHandles?.map((h) => h.id) ?? [
                        ...PLOTTER_INPUT_IDS,
                      ]
                    }
                    config={coercePlotterConfig(data.defaultConfig)}
                  />
                </ReadingPanel>
              ) : null}
            </FlowNodeBody>
            </div>
          ) : null}
        </FlowNodeShell>
      </div>
    </StudioFlowCanvasDisplayScaleProvider>
  );
}
