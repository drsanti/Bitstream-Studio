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
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import "@xyflow/react/dist/style.css";
import "../nodes/flow-node/flow-node-handles.css";
import "../flow-canvas-minimap.css";
import "../layout-nodes/layout-flow-nodes.css";
import { StudioNodeCard } from "../nodes/StudioNodeCard";
import { RerouteLayoutNode } from "../layout-nodes/RerouteLayoutNode";
import { FrameLayoutNode } from "../layout-nodes/FrameLayoutNode";
import { NoteLayoutNode } from "../layout-nodes/NoteLayoutNode";
import { SplitLayoutNode } from "../layout-nodes/SplitLayoutNode";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import type { FlowGraphNode } from "../store/flow-editor.store";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { useFlowCanvasLayoutShortcuts } from "../keyboard/use-flow-canvas-layout-shortcuts";
import type { LayoutMenuEntryId } from "../layout/layout-flow-nodes.types";
import { isStudioFlowNode } from "../layout/layout-port-resolution";
import type { FlowCanvasPreferences } from "./flow-canvas-ui-persistence";
import { FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW } from "./flow-canvas-ui-persistence";
import { parseStudioAssetDragData, type StudioAssetDragPayloadV1 } from "../../asset-browser/studio-asset-drag";
import { parsePaletteCatalogDragData } from "./node-palette/palette-catalog-drag";
import { parseStudioGlbExtractDragData, type StudioGlbExtractDragPayloadV1 } from "./node-palette/glb-extract-drag";
import { FlowAddNodeMenu } from "./FlowAddNodeMenu";
import type { FlowCanvasGraphHandle } from "./flow-canvas-graph-handle";
import { resolveAddNodeMenuAnchor } from "../keyboard/resolve-add-node-menu-anchor";
import { listAddableCatalogEntries } from "./node-palette/list-addable-catalog-entries";

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
  transformColor: string;
  minimapCategoryColors: Record<NodeCatalogEntry["category"], string>;
  catalogEntries: readonly NodeCatalogEntry[];
  onAddCatalogEntryAtFlowPosition: (
    entry: NodeCatalogEntry,
    flowPosition: { x: number; y: number },
  ) => void;
  nodes: FlowGraphNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<FlowGraphNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onSelectionChange: (selectedNodeIds: string[]) => void;
  fitViewVersion: number;
  initialViewport?: Viewport | null;
  onViewportMoveEnd?: (viewport: Viewport) => void;
  applyViewport?: Viewport | null;
  applyViewportNonce?: number;
  onDropPaletteCatalogNode?: (
    catalogNodeId: string,
    flowPosition: { x: number; y: number },
  ) => void;
  onDropGlbExtract?: (
    payload: StudioGlbExtractDragPayloadV1,
    flowPosition: { x: number; y: number },
  ) => void;
  onDropStudioAsset?: (
    payload: StudioAssetDragPayloadV1,
    flowPosition: { x: number; y: number },
  ) => void;
  canvasBackgroundColor: string;
  flowCanvasPreferences: FlowCanvasPreferences;
  onFlowPanePointerEvent?: (event: { button: number }) => void;
};

export const FlowCanvas = forwardRef<FlowCanvasGraphHandle, FlowCanvasProps>(function FlowCanvas(props, ref) {
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
    transformColor,
    minimapCategoryColors,
    catalogEntries,
    onAddCatalogEntryAtFlowPosition,
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
    onFlowPanePointerEvent,
  } = props;

  const reactFlowRef = useRef<ReactFlowInstance<FlowGraphNode> | null>(null);
  const graphWrapperRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const addLayoutNodeAt = useFlowEditorStore((s) => s.addLayoutNodeAt);
  const [addNodeMenuAnchor, setAddNodeMenuAnchor] = useState<{ clientX: number; clientY: number } | null>(
    null,
  );

  const addableEntries = useMemo(() => listAddableCatalogEntries(catalogEntries), [catalogEntries]);

  useFlowCanvasLayoutShortcuts(lastPointerRef, reactFlowRef);

  useImperativeHandle(
    ref,
    () => ({
      resolveAddNodeMenuAnchor: () =>
        resolveAddNodeMenuAnchor({
          wrapper: graphWrapperRef.current,
          lastPointer: lastPointerRef.current,
        }),
      isAddNodeMenuOpen: () => addNodeMenuAnchor != null,
      closeAddNodeMenu: () => setAddNodeMenuAnchor(null),
      openAddNodeMenuAt: (anchor) => setAddNodeMenuAnchor(anchor),
      toggleAddNodeMenu: () => {
        setAddNodeMenuAnchor((prev) => {
          if (prev != null) {
            return null;
          }
          return resolveAddNodeMenuAnchor({
            wrapper: graphWrapperRef.current,
            lastPointer: lastPointerRef.current,
          });
        });
      },
    }),
    [addNodeMenuAnchor],
  );

  const openAddNodeMenuAtPointer = useCallback((clientX: number, clientY: number) => {
    lastPointerRef.current = { clientX, clientY };
    setAddNodeMenuAnchor({ clientX, clientY });
  }, []);

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
      "studio-reroute": RerouteLayoutNode,
      "studio-frame": FrameLayoutNode,
      "studio-note": NoteLayoutNode,
      "studio-split": SplitLayoutNode,
    }),
    [],
  );

  const onPickLayoutEntry = useCallback(
    (kind: LayoutMenuEntryId, flowPosition: { x: number; y: number }) => {
      addLayoutNodeAt(kind, flowPosition);
    },
    [addLayoutNodeAt],
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
      transform: transformColor,
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
    transformColor,
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
    (node: FlowGraphNode) => {
      if (node.type === "studio-reroute" || node.type === "studio-split") {
        return "#71717a";
      }
      if (node.type === "studio-frame") {
        return "#52525b";
      }
      if (node.type === "studio-note") {
        return "#ca8a04";
      }
      const category = isStudioFlowNode(node) ? node.data?.category : undefined;
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
        ref={graphWrapperRef}
        className="relative min-h-0 flex-1"
        style={{ borderColor }}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        onPointerMove={(event) => {
          lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
        }}
      >
        <ReactFlow<FlowGraphNode>
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
          onPaneClick={(event) => {
            if (addNodeMenuAnchor != null) {
              setAddNodeMenuAnchor(null);
            }
            onFlowPanePointerEvent?.({ button: event.button });
          }}
          onPaneContextMenu={(event) => {
            event.preventDefault();
            openAddNodeMenuAtPointer(event.clientX, event.clientY);
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
          {addNodeMenuAnchor != null ? (
            <FlowAddNodeMenu
              clientX={addNodeMenuAnchor.clientX}
              clientY={addNodeMenuAnchor.clientY}
              entries={addableEntries}
              categoryColors={minimapCategoryColors}
              onPickEntry={onAddCatalogEntryAtFlowPosition}
              onPickLayoutEntry={onPickLayoutEntry}
              onClose={() => setAddNodeMenuAnchor(null)}
            />
          ) : null}
        </ReactFlow>
      </div>
    </section>
  );
});
