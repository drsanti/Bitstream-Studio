import {
  Background,
  BackgroundVariant,
  MiniMap,
  type ReactFlowInstance,
  ReactFlow,
  type Edge,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type Viewport,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, type DragEvent } from "react";
import "@xyflow/react/dist/style.css";
import "../nodes/flow-node/flow-node-handles.css";
import "../flow-canvas-minimap.css";
import { StudioNodeCard } from "../nodes/StudioNodeCard";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import type { StudioNode } from "../store/flow-editor.store";
import type { FlowCanvasPreferences } from "./flow-canvas-ui-persistence";
import { FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW } from "./flow-canvas-ui-persistence";
import { parseStudioAssetDragData, type StudioAssetDragPayloadV1 } from "../../asset-browser/studio-asset-drag";
import { parsePaletteCatalogDragData } from "./node-palette/palette-catalog-drag";
import { parseStudioGlbExtractDragData, type StudioGlbExtractDragPayloadV1 } from "./node-palette/glb-extract-drag";

type FlowCanvasProps = {
  borderColor: string;
  panelColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  numberColor: string;
  booleanColor: string;
  stringColor: string;
  eventColor: string;
  vector3Color: string;
  quaternionColor: string;
  environmentColor: string;
  cameraColor: string;
  glbAnimationColor: string;
  minimapCategoryColors: Record<NodeCatalogEntry["category"], string>;
  nodes: StudioNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<StudioNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onSelectionChange: (selectedNodeIds: string[]) => void;
  /** When greater than zero, fit the view (templates, import, clear). Skip zero so a restored viewport can apply on init. */
  fitViewVersion: number;
  /** Applied once when React Flow initializes (e.g. restored from localStorage). */
  initialViewport?: Viewport | null;
  /** Called after pan/zoom settles; parent debounces persistence. */
  onViewportMoveEnd?: (viewport: Viewport) => void;
  /** Bump nonce after import (etc.) to apply pan/zoom without remounting. */
  applyViewport?: Viewport | null;
  applyViewportNonce?: number;
  /** Drop palette rows onto the canvas (flow coordinates from React Flow). */
  onDropPaletteCatalogNode?: (
    catalogNodeId: string,
    flowPosition: { x: number; y: number },
  ) => void;
  /** Drop GLB extraction rows (custom MIME) onto the canvas. */
  onDropGlbExtract?: (
    payload: StudioGlbExtractDragPayloadV1,
    flowPosition: { x: number; y: number },
  ) => void;
  /** Drop Asset Browser model row onto the canvas. */
  onDropStudioAsset?: (
    payload: StudioAssetDragPayloadV1,
    flowPosition: { x: number; y: number },
  ) => void;
  /** Theme default when `flowCanvasPreferences.backgroundHex` is null. */
  canvasBackgroundColor: string;
  flowCanvasPreferences: FlowCanvasPreferences;
};

export function FlowCanvas(props: FlowCanvasProps) {
  const {
    borderColor,
    panelColor,
    numberColor,
    booleanColor,
    stringColor,
    eventColor,
    vector3Color,
    quaternionColor,
    environmentColor,
    cameraColor,
    glbAnimationColor,
    minimapCategoryColors,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    fitViewVersion,
    initialViewport,
    onViewportMoveEnd,
    applyViewport,
    applyViewportNonce,
    onDropPaletteCatalogNode,
    onDropGlbExtract,
    onDropStudioAsset,
    canvasBackgroundColor,
    flowCanvasPreferences,
  } = props;
  const reactFlowRef = useRef<ReactFlowInstance<StudioNode> | null>(null);

  const canAcceptCanvasDrop =
    onDropPaletteCatalogNode != null ||
    onDropGlbExtract != null ||
    onDropStudioAsset != null;

  const handleCanvasDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!canAcceptCanvasDrop) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [canAcceptCanvasDrop],
  );

  const handleCanvasDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!canAcceptCanvasDrop) {
        return;
      }
      event.preventDefault();
      const instance = reactFlowRef.current;
      if (instance == null) {
        return;
      }
      const flowPosition = instance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (onDropStudioAsset != null) {
        const assetPayload = parseStudioAssetDragData(event.dataTransfer);
        if (assetPayload != null) {
          onDropStudioAsset(assetPayload, flowPosition);
          return;
        }
      }

      if (onDropGlbExtract != null) {
        const glbPayload = parseStudioGlbExtractDragData(event.dataTransfer);
        if (glbPayload != null) {
          onDropGlbExtract(glbPayload, flowPosition);
          return;
        }
      }

      if (onDropPaletteCatalogNode != null) {
        const catalogNodeId = parsePaletteCatalogDragData(event.dataTransfer);
        if (catalogNodeId != null) {
          onDropPaletteCatalogNode(catalogNodeId, flowPosition);
        }
      }
    },
    [canAcceptCanvasDrop, onDropGlbExtract, onDropPaletteCatalogNode, onDropStudioAsset],
  );
  const nodeTypes = useMemo(
    () => ({
      studio: StudioNodeCard,
    }),
    [],
  );
  const coloredEdges = useMemo(() => {
    const colorByType: Record<string, string> = {
      number: numberColor,
      boolean: booleanColor,
      string: stringColor,
      event: eventColor,
      vector3: vector3Color,
      quaternion: quaternionColor,
      environment: environmentColor,
      camera: cameraColor,
      glbAnimation: glbAnimationColor,
    };
    return edges.map((edge) => {
      const type = typeof edge.label === "string" ? edge.label : "";
      const stroke = colorByType[type] ?? "rgb(113 113 122)";
      return {
        ...edge,
        type: FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW[flowCanvasPreferences.edgeRoutingStyle],
        style: {
          ...(edge.style ?? {}),
          stroke,
          strokeWidth: 2,
        },
        labelStyle: {
          ...(edge.labelStyle ?? {}),
          fill: stroke,
          fontSize: 11,
          fontWeight: 600,
        },
      };
    });
  }, [
    edges,
    numberColor,
    booleanColor,
    stringColor,
    eventColor,
    vector3Color,
    quaternionColor,
    environmentColor,
    cameraColor,
    glbAnimationColor,
    flowCanvasPreferences.edgeRoutingStyle,
  ]);

  const bootViewportAppliedRef = useRef(false);

  useEffect(() => {
    if (fitViewVersion === 0) {
      return;
    }
    reactFlowRef.current?.fitView({
      duration: 240,
      padding: 0.2,
    });
  }, [fitViewVersion]);

  useEffect(() => {
    const nonce = applyViewportNonce ?? 0;
    if (nonce === 0 || applyViewport == null) {
      return;
    }
    reactFlowRef.current?.setViewport(applyViewport);
  }, [applyViewportNonce, applyViewport]);

  const effectiveCanvasBackground =
    flowCanvasPreferences.backgroundHex ?? canvasBackgroundColor;
  const snapGrid = useMemo(
    (): [number, number] => [
      flowCanvasPreferences.gridSize,
      flowCanvasPreferences.gridSize,
    ],
    [flowCanvasPreferences.gridSize],
  );

  const minimapNodeColor = useCallback(
    (node: StudioNode) => {
      const category = node.data?.category;
      if (category != null && minimapCategoryColors[category] != null) {
        return minimapCategoryColors[category];
      }
      return "#52525b";
    },
    [minimapCategoryColors],
  );

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded border"
      style={{
        borderColor,
        backgroundColor: panelColor,
      }}
    >
      <div
        className="relative min-h-0 flex-1"
        style={{ borderColor }}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        <ReactFlow<StudioNode>
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          style={{ backgroundColor: effectiveCanvasBackground }}
          nodes={nodes}
          edges={coloredEdges}
          nodeTypes={nodeTypes}
          elementsSelectable
          snapToGrid={flowCanvasPreferences.snapToGrid}
          snapGrid={snapGrid}
          defaultEdgeOptions={{
            type: FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW[flowCanvasPreferences.edgeRoutingStyle],
            animated: true,
            style: { strokeWidth: 2 },
          }}
          deleteKeyCode={["Backspace", "Delete"]}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={(selection) => {
            onSelectionChange(selection.nodes.map((n) => n.id));
          }}
          onMoveEnd={
            onViewportMoveEnd != null
              ? (_event, viewport) => {
                  onViewportMoveEnd(viewport);
                }
              : undefined
          }
          onInit={(instance) => {
            reactFlowRef.current = instance;
            if (
              !bootViewportAppliedRef.current &&
              initialViewport != null &&
              Number.isFinite(initialViewport.x) &&
              Number.isFinite(initialViewport.y) &&
              Number.isFinite(initialViewport.zoom) &&
              initialViewport.zoom > 0
            ) {
              instance.setViewport(initialViewport);
              bootViewportAppliedRef.current = true;
            }
          }}
        >
          {flowCanvasPreferences.showGrid ? (
            <Background
              variant={BackgroundVariant.Dots}
              gap={flowCanvasPreferences.gridSize}
              size={1}
              color="#52525b"
            />
          ) : null}
          {flowCanvasPreferences.showMinimap ? (
            <MiniMap
              nodeColor={minimapNodeColor}
              nodeStrokeWidth={2}
              zoomable
              pannable
              maskColor="rgb(9 9 11 / 0.78)"
              className="studio-flow-minimap"
            />
          ) : null}
        </ReactFlow>
      </div>
    </section>
  );
}
