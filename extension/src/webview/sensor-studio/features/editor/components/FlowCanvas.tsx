import {
  Background,
  BackgroundVariant,
  MiniMap,
  type OnConnectStartParams,
  type ReactFlowInstance,
  ReactFlow,
  type Edge,
  type FinalConnectionState,
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
  type MouseEvent,
  type TouchEvent,
} from "react";
import "@xyflow/react/dist/style.css";
import "../nodes/flow-node/flow-node-handles.css";
import "../nodes/flow-node/flow-node-selection.css";
import "../flow-canvas-minimap.css";
import "../flow-canvas-interaction.css";
import "../layout-nodes/layout-flow-nodes.css";
import "../layout-nodes/subgraph-flow-nodes.css";
import { StudioNodeCard } from "../nodes/StudioNodeCard";
import { RerouteLayoutNode } from "../layout-nodes/RerouteLayoutNode";
import { FrameLayoutNode } from "../layout-nodes/FrameLayoutNode";
import { NoteLayoutNode } from "../layout-nodes/NoteLayoutNode";
import { SplitLayoutNode } from "../layout-nodes/SplitLayoutNode";
import { NodeGroupLayoutNode } from "../layout-nodes/NodeGroupLayoutNode";
import { GroupInputLayoutNode } from "../layout-nodes/GroupInputLayoutNode";
import { GroupOutputLayoutNode } from "../layout-nodes/GroupOutputLayoutNode";
import { FlowGraphBreadcrumbChrome } from "./FlowGraphBreadcrumb";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import type { FlowGraphNode } from "../store/flow-editor.store";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { useFlowCanvasLayoutShortcuts } from "../keyboard/use-flow-canvas-layout-shortcuts";
import type { LayoutMenuEntryId } from "../layout/layout-flow-nodes.types";
import { isStudioFlowNode } from "../layout/layout-port-resolution";
import type { FlowCanvasPreferences } from "./flow-canvas-ui-persistence";
import { FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW } from "./flow-canvas-ui-persistence";
import {
  parseStudioAssetDragData,
  type StudioAssetDragPayloadV1,
} from "../../asset-browser/studio-asset-drag";
import { parsePaletteCatalogDragData } from "./node-palette/palette-catalog-drag";
import {
  parseStudioGlbExtractDragData,
  type StudioGlbExtractDragPayloadV1,
} from "./node-palette/glb-extract-drag";
import { parseStudioNodeGroupAssetDragData } from "./node-palette/node-group-asset-drag";
import { FlowAddNodeMenu } from "./FlowAddNodeMenu";
import type { FlowCanvasGraphHandle } from "./flow-canvas-graph-handle";
import { FlowCanvasToolbar } from "./flow-toolbar/FlowCanvasToolbar";
import { FlowCanvasTopLeftChrome } from "./flow-toolbar/FlowCanvasTopLeftChrome";
import { NodeSelectionToolbar } from "./flow-toolbar/NodeSelectionToolbar";
import { resolveAddNodeMenuAnchor } from "../keyboard/resolve-add-node-menu-anchor";
import { readRecentCatalogNodeIds } from "../keyboard/recent-catalog-nodes";
import { listAddableCatalogEntries } from "./node-palette/list-addable-catalog-entries";
import {
  inferLayoutNodeSmartConnectPortType,
  resolveFlowSourcePortType,
  resolveFlowTargetPortType,
} from "../layout/layout-port-resolution";
import {
  buildSmartConnectAutoWire,
  filterCatalogEntriesForSmartConnect,
  rankCatalogEntriesForSmartConnect,
  type SmartConnectDragContext,
  type SmartConnectPortType,
} from "../connect/smart-connect-catalog";
import { FlowConnectDragHint } from "./flow-toolbar/FlowConnectDragHint";
import { resolveStudioGroupNodePortType } from "../subgraphs/resolve-studio-group-port";
import {
  isStudioNodeGroupNode,
  type StudioNodeGroupData,
} from "../subgraphs/studio-subgraph.types";
import {
  sortFlowNodesParentFirst,
  isStudioFrameNode,
} from "../layout/frame-flow-nodes";
import {
  buildFlowPortColorMap,
  decorateFlowEdges,
  FLOW_EDGE_FALLBACK_STROKE,
  strokeForPortType,
} from "../edges/flow-port-edge-colors";

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
  fogColor: string;
  studioLightColor: string;
  postProcessingColor: string;
  contactShadowsColor: string;
  particleEmitterColor: string;
  audioBusColor: string;
  minimapCategoryColors: Record<NodeCatalogEntry["category"], string>;
  catalogEntries: readonly NodeCatalogEntry[];
  onAddCatalogEntryAtFlowPosition: (
    entry: NodeCatalogEntry,
    flowPosition: { x: number; y: number },
  ) => string | undefined;
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
  onDropNodeGroupAsset?: (
    assetId: string,
    flowPosition: { x: number; y: number },
  ) => void;
  canvasBackgroundColor: string;
  flowCanvasPreferences: FlowCanvasPreferences;
  onFlowCanvasPreferencesChange?: (
    patch: Partial<FlowCanvasPreferences>,
  ) => void;
  onFlowPanePointerEvent?: (event: { button: number }) => void;
};

export const FlowCanvas = forwardRef<FlowCanvasGraphHandle, FlowCanvasProps>(
  function FlowCanvas(props, ref) {
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
      fogColor,
      studioLightColor,
      postProcessingColor,
      contactShadowsColor,
      particleEmitterColor,
      audioBusColor,
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
      onDropNodeGroupAsset,
      canvasBackgroundColor,
      flowCanvasPreferences,
      onFlowCanvasPreferencesChange,
      onFlowPanePointerEvent,
    } = props;

    const interactionMode = flowCanvasPreferences.interactionMode ?? "select";
    const isPanMode = interactionMode === "pan";

    const reactFlowRef = useRef<ReactFlowInstance<FlowGraphNode> | null>(null);
    const graphWrapperRef = useRef<HTMLDivElement>(null);
    const lastPointerRef = useRef<{ clientX: number; clientY: number } | null>(
      null,
    );
    const addLayoutNodeAt = useFlowEditorStore((s) => s.addLayoutNodeAt);
    const insertRerouteOnEdge = useFlowEditorStore(
      (s) => s.insertRerouteOnEdge,
    );
    const applyFlowFrameDragStop = useFlowEditorStore(
      (s) => s.applyFlowFrameDragStop,
    );
    const enterGroup = useFlowEditorStore((s) => s.enterGroup);
    const subgraphs = useFlowEditorStore((s) => s.subgraphs);
    const [addNodeMenuAnchor, setAddNodeMenuAnchor] = useState<{
      clientX: number;
      clientY: number;
      smartConnect?: SmartConnectDragContext;
      smartConnectShowAll?: boolean;
      smartConnectSkipAutoWire?: boolean;
    } | null>(null);
    const [connectingLineStroke, setConnectingLineStroke] = useState<
      string | null
    >(null);
    const [connectDragModifiers, setConnectDragModifiers] = useState({
      shiftKey: false,
      altKey: false,
    });
    const connectDragRef = useRef<SmartConnectDragContext | null>(null);
    const connectSucceededRef = useRef(false);
    /** Prevents the pane click that follows connect-end from instantly closing the add menu. */
    const suppressPaneDismissRef = useRef(false);

    const portColorMap = useMemo(
      () =>
        buildFlowPortColorMap({
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
          fogColor,
          studioLightColor,
          postProcessingColor,
          contactShadowsColor,
          particleEmitterColor,
          audioBusColor,
        }),
      [
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
        fogColor,
        studioLightColor,
        postProcessingColor,
        contactShadowsColor,
        particleEmitterColor,
        audioBusColor,
      ],
    );

    const connectionLineStyle = useMemo(
      () => ({
        stroke: connectingLineStroke ?? FLOW_EDGE_FALLBACK_STROKE,
        strokeWidth: 2,
      }),
      [connectingLineStroke],
    );

    const fitAllInView = useCallback(() => {
      reactFlowRef.current?.fitView({
        duration: 240,
        padding: 0.2,
      });
    }, []);

    const fitSelectionInView = useCallback((nodeIds: string[]) => {
      if (nodeIds.length === 0) {
        return;
      }
      reactFlowRef.current?.fitView({
        nodes: nodeIds.map((id) => ({ id })),
        padding: 0.45,
        duration: 220,
      });
    }, []);

    const addableEntries = useMemo(
      () => listAddableCatalogEntries(catalogEntries),
      [catalogEntries],
    );

    const addNodeMenuEntries = useMemo(() => {
      const ctx = addNodeMenuAnchor?.smartConnect;
      if (ctx == null) {
        return addableEntries;
      }
      let list = addableEntries;
      if (!addNodeMenuAnchor.smartConnectShowAll) {
        const filtered = filterCatalogEntriesForSmartConnect(addableEntries, ctx);
        // If the filter is too strict, still show the menu (Shift remains the explicit "show all").
        list = filtered.length > 0 ? filtered : addableEntries;
      }
      return rankCatalogEntriesForSmartConnect(list, ctx, {
        recentCatalogIds: readRecentCatalogNodeIds(),
        preferCompatible: true,
      });
    }, [addNodeMenuAnchor, addableEntries]);

    const smartConnectMenuHint = useMemo(() => {
      const anchor = addNodeMenuAnchor;
      const ctx = anchor?.smartConnect;
      if (ctx == null || anchor.smartConnectShowAll) {
        return undefined;
      }
      if (ctx.portType == null) {
        return undefined;
      }
      const filtered = filterCatalogEntriesForSmartConnect(addableEntries, ctx);
      if (filtered.length === 0) {
        return "No exact type matches — showing all nodes";
      }
      return undefined;
    }, [addNodeMenuAnchor, addableEntries]);

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
        getSelectedNodeGroupId: () => {
          const selectedGroups = nodes.filter(
            (n) => n.selected && isStudioNodeGroupNode(n),
          );
          if (selectedGroups.length !== 1) {
            return null;
          }
          const group = selectedGroups[0]!;
          return group.data.subgraphId ?? group.id;
        },
        fitSelectionInView,
        fitAllInView,
      }),
      [addNodeMenuAnchor, fitAllInView, fitSelectionInView, nodes],
    );

    const openAddNodeMenuAtPointer = useCallback(
      (clientX: number, clientY: number) => {
        lastPointerRef.current = { clientX, clientY };
        setAddNodeMenuAnchor({ clientX, clientY });
      },
      [],
    );

    const canAcceptCanvasDrop =
      onDropPaletteCatalogNode != null ||
      onDropGlbExtract != null ||
      onDropStudioAsset != null ||
      onDropNodeGroupAsset != null;

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

        if (onDropNodeGroupAsset != null) {
          const groupPayload = parseStudioNodeGroupAssetDragData(
            event.dataTransfer,
          );
          if (groupPayload != null) {
            onDropNodeGroupAsset(groupPayload.assetId, flowPosition);
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
      [
        canAcceptCanvasDrop,
        onDropGlbExtract,
        onDropNodeGroupAsset,
        onDropPaletteCatalogNode,
        onDropStudioAsset,
      ],
    );

    const nodeTypes = useMemo(
      () => ({
        studio: StudioNodeCard,
        "studio-reroute": RerouteLayoutNode,
        "studio-frame": FrameLayoutNode,
        "studio-note": NoteLayoutNode,
        "studio-split": SplitLayoutNode,
        "studio-node-group": NodeGroupLayoutNode,
        "studio-group-input": GroupInputLayoutNode,
        "studio-group-output": GroupOutputLayoutNode,
      }),
      [],
    );

    const nodesForRender = useMemo(
      () =>
        sortFlowNodesParentFirst(
          nodes.map((node) => {
            if (isStudioFrameNode(node)) {
              return node.dragHandle === ".studio-frame-node__header"
                ? node
                : { ...node, dragHandle: ".studio-frame-node__header" };
            }
            if (node.type === "studio-note") {
              const locked = Boolean((node.data as any)?.locked);
              return locked ? { ...node, draggable: false } : node;
            }
            return node;
          }),
        ),
      [nodes],
    );

    const onPickLayoutEntry = useCallback(
      (kind: LayoutMenuEntryId, flowPosition: { x: number; y: number }) => {
        addLayoutNodeAt(kind, flowPosition);
      },
      [addLayoutNodeAt],
    );

    const coloredEdges = useMemo(
      () =>
        decorateFlowEdges(
          edges,
          portColorMap,
          flowCanvasPreferences.edgeRoutingStyle,
        ),
      [edges, portColorMap, flowCanvasPreferences.edgeRoutingStyle],
    );

    const resolveConnectPortType = useCallback(
      (
        node: FlowGraphNode,
        handleId: string,
        handleType: "source" | "target",
      ): SmartConnectPortType | null => {
        if (handleType === "source") {
          return (
            resolveStudioGroupNodePortType(node, handleId, "output", subgraphs) ??
            resolveFlowSourcePortType(node, handleId)
          );
        }
        return (
          resolveStudioGroupNodePortType(node, handleId, "input", subgraphs) ??
          resolveFlowTargetPortType(node, handleId)
        );
      },
      [subgraphs],
    );

    const handleConnectStart = useCallback(
      (_event: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
        const { nodeId, handleId, handleType } = params;
        connectSucceededRef.current = false;
        connectDragRef.current = null;
        if (
          nodeId == null ||
          handleId == null ||
          (handleType !== "source" && handleType !== "target")
        ) {
          setConnectingLineStroke(null);
          return;
        }
        const node = nodes.find((n) => n.id === nodeId);
        if (node == null) {
          setConnectingLineStroke(null);
          return;
        }
        const isLayoutJunction =
          node.type === "studio-reroute" || node.type === "studio-split";
        let portType = resolveConnectPortType(node, handleId, handleType);
        if (portType == null && isLayoutJunction) {
          portType = inferLayoutNodeSmartConnectPortType(
            node,
            handleId,
            handleType,
            edges,
            nodes,
          );
        }
        if (portType == null && !isLayoutJunction) {
          setConnectingLineStroke(null);
          return;
        }
        connectDragRef.current = {
          nodeId,
          handleId,
          handleType,
          portType,
        };
        setConnectingLineStroke(
          portType != null
            ? strokeForPortType(portColorMap, portType)
            : FLOW_EDGE_FALLBACK_STROKE,
        );
        setConnectDragModifiers({
          shiftKey: _event.shiftKey,
          altKey: _event.altKey,
        });
      },
      [edges, nodes, portColorMap, resolveConnectPortType],
    );

    const handleConnectEnd = useCallback(
      (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
        const ctx = connectDragRef.current;
        connectDragRef.current = null;
        setConnectingLineStroke(null);

        const clientX =
          "clientX" in event ? event.clientX : event.changedTouches?.[0]?.clientX;
        const clientY =
          "clientY" in event ? event.clientY : event.changedTouches?.[0]?.clientY;

        const droppedOnHandle =
          connectionState.toNode != null || connectionState.toHandle != null;
        const completedConnection =
          connectSucceededRef.current || connectionState.isValid === true;

        if (
          ctx == null ||
          completedConnection ||
          clientX == null ||
          clientY == null ||
          droppedOnHandle
        ) {
          return;
        }

        lastPointerRef.current = { clientX, clientY };
        suppressPaneDismissRef.current = true;
        // Open after the pane click from the same mouse-up (which would close the menu).
        requestAnimationFrame(() => {
          setAddNodeMenuAnchor({
            clientX,
            clientY,
            smartConnect: ctx,
            smartConnectShowAll: event.shiftKey,
            smartConnectSkipAutoWire: event.altKey,
          });
          requestAnimationFrame(() => {
            suppressPaneDismissRef.current = false;
          });
        });
      },
      [],
    );

    const handleConnect = useCallback(
      (connection: Parameters<OnConnect>[0]) => {
        if (connection.source != null && connection.target != null) {
          connectSucceededRef.current = true;
        }
        setConnectingLineStroke(null);
        connectDragRef.current = null;
        onConnect(connection);
      },
      [onConnect],
    );

    const handlePickAddNodeEntry = useCallback(
      (entry: NodeCatalogEntry, flowPosition: { x: number; y: number }) => {
        const menu = addNodeMenuAnchor;
        const newNodeId = onAddCatalogEntryAtFlowPosition(entry, flowPosition);
        setAddNodeMenuAnchor(null);

        if (
          menu?.smartConnect == null ||
          menu.smartConnectSkipAutoWire ||
          newNodeId == null
        ) {
          return;
        }
        const wire = buildSmartConnectAutoWire(menu.smartConnect, newNodeId, entry);
        if (wire == null) {
          return;
        }
        onConnect(wire);
      },
      [addNodeMenuAnchor, onAddCatalogEntryAtFlowPosition, onConnect],
    );

    useEffect(() => {
      if (connectingLineStroke == null) {
        return;
      }
      const onKey = (event: KeyboardEvent) => {
        setConnectDragModifiers({
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        });
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);
      return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("keyup", onKey);
      };
    }, [connectingLineStroke]);

    const handleEdgeClick = useCallback(
      (event: MouseEvent, edge: Edge) => {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }
        if (!event.shiftKey) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const instance = reactFlowRef.current;
        if (instance == null) {
          return;
        }
        const flowPos = instance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        insertRerouteOnEdge(edge.id, flowPos);
      },
      [insertRerouteOnEdge],
    );

    const handleNodeDragStop = useCallback(
      (_event: MouseEvent, dragged: FlowGraphNode) => {
        applyFlowFrameDragStop(dragged);
      },
      [applyFlowFrameDragStop],
    );

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
        if (node.type === "studio-node-group") {
          return "#0891b2";
        }
        if (
          node.type === "studio-group-input" ||
          node.type === "studio-group-output"
        ) {
          return "#52525b";
        }
        const category = isStudioFlowNode(node)
          ? node.data?.category
          : undefined;
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
          className={
            isPanMode
              ? "studio-flow-canvas--pan relative min-h-0 flex-1"
              : "studio-flow-canvas--select relative min-h-0 flex-1"
          }
          style={{ borderColor }}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onPointerMove={(event) => {
            lastPointerRef.current = {
              clientX: event.clientX,
              clientY: event.clientY,
            };
          }}
        >
          <FlowGraphBreadcrumbChrome />
          <div className="pointer-events-none absolute right-3 top-3 z-20 flex max-w-[min(calc(100%-1.5rem),520px)] flex-col items-end gap-2">
            <FlowCanvasTopLeftChrome />
          </div>
          <FlowCanvasToolbar
            onFitAll={fitAllInView}
            interactionMode={interactionMode}
            onInteractionModeChange={(mode) => {
              onFlowCanvasPreferencesChange?.({ interactionMode: mode });
            }}
          />
          <NodeSelectionToolbar
            wrapperRef={graphWrapperRef}
            onFitSelection={fitSelectionInView}
          />
          <FlowConnectDragHint
            active={connectingLineStroke != null}
            shiftKey={connectDragModifiers.shiftKey}
            altKey={connectDragModifiers.altKey}
          />
          <ReactFlow<FlowGraphNode>
            colorMode="dark"
            proOptions={{ hideAttribution: true }}
            style={{ backgroundColor: effectiveCanvasBackground }}
            nodes={nodesForRender}
            edges={coloredEdges}
            nodeTypes={nodeTypes}
            elementsSelectable
            panOnDrag={isPanMode}
            selectionOnDrag={!isPanMode}
            snapToGrid={flowCanvasPreferences.snapToGrid}
            snapGrid={snapGrid}
            defaultEdgeOptions={{
              type: FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW[
                flowCanvasPreferences.edgeRoutingStyle
              ],
              animated: true,
              style: { strokeWidth: 2 },
            }}
            deleteKeyCode={["Backspace", "Delete"]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            onNodeDoubleClick={(_event, node) => {
              if (isStudioNodeGroupNode(node)) {
                const data = node.data as StudioNodeGroupData;
                enterGroup(data.subgraphId ?? node.id);
              }
            }}
            onConnect={handleConnect}
            onConnectStart={handleConnectStart}
            onConnectEnd={handleConnectEnd}
            onEdgeClick={handleEdgeClick}
            connectionLineStyle={connectionLineStyle}
            onSelectionChange={(selection) => {
              onSelectionChange(selection.nodes.map((n) => n.id));
            }}
            onPaneClick={(event) => {
              if (!suppressPaneDismissRef.current && addNodeMenuAnchor != null) {
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
                entries={addNodeMenuEntries}
                bannerHint={smartConnectMenuHint}
                categoryColors={minimapCategoryColors}
                onPickEntry={handlePickAddNodeEntry}
                onPickLayoutEntry={onPickLayoutEntry}
                onClose={() => setAddNodeMenuAnchor(null)}
              />
            ) : null}
          </ReactFlow>
        </div>
      </section>
    );
  },
);
