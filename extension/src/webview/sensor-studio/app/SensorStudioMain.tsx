import type { Edge, Viewport } from "@xyflow/react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { useBmi270FusionEulerWireTapStore } from "../../bitstream-app/state/bmi270FusionEulerWireTap.store";
import { useBmi270FusionQuatWireTapStore } from "../../bitstream-app/state/bmi270FusionQuatWireTap.store";
import type { NodeCatalogEntry } from "../core/config/config-types";
import { configService } from "../core/config/config-service";
import { StudioLayout } from "../features/editor/components/StudioLayout";
import {
  type StudioDemoTemplateId,
  type StudioNode,
  STUDIO_HANDLE_IN,
  STUDIO_HANDLE_OUT,
  useFlowEditorStore,
} from "../features/editor/store/flow-editor.store";
import type { StudioAssetDragPayloadV1 } from "../features/asset-browser/studio-asset-drag";
import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
  resolveStudioModelGltfFetchUrl,
} from "../features/asset-browser/studio-model-scene-bindings";
import { useStudioAssetDescriptors } from "../features/asset-browser/useStudioAssetDescriptors";
import {
  catalogEntrySpawnsLinkedToModel,
  resolveSingleModelSelectParentId,
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
} from "../features/editor/model/model-generated-bindings";
import type { StudioGltfExtractRow } from "../features/editor/gltf/studio-gltf-extract";
import type { StudioGlbExtractDragPayloadV1 } from "../features/editor/components/node-palette/glb-extract-drag";
import {
  type StudioPersistedViewport,
  isValidStudioPersistedViewport,
  readPersistedFlowDocument,
  writePersistedFlowDocument,
} from "../persistence/flow-graph.repository";
import { useSensorStudioTelemetryFlowRefresh } from "./useSensorStudioTelemetryFlowRefresh";

function flowStructureFingerprint(
  nodes: StudioNode[],
  edges: Edge[],
  selectedNodeId: string | null,
  selectedNodeIds: string[],
): string {
  return JSON.stringify({
    n: nodes.map((node) => ({
      id: node.id,
      position: node.position,
      type: node.type,
      data: {
        nodeId: node.data.nodeId,
        label: node.data.label,
        category: node.data.category,
        defaultConfig: node.data.defaultConfig,
        ui: node.data.ui,
        inputType: node.data.inputType,
        outputType: node.data.outputType,
        outputHandles: node.data.outputHandles,
      },
    })),
    e: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })),
    sel: selectedNodeId,
    sels: selectedNodeIds,
  });
}

const STUDIO_MODEL_TO_VIEWER_OFFSET_X = 280;
const STUDIO_VIEWER_TO_MODEL_OFFSET_X = 320;

function modelViewerHasModelInputEdge(viewerId: string, edges: Edge[]): boolean {
  return edges.some(
    (e) => e.target === viewerId && (e.targetHandle ?? STUDIO_HANDLE_IN) === STUDIO_HANDLE_IN,
  );
}

/** Model Viewer nodes with no wire on the **Model** (`in`) socket. */
function findModelViewersWithEmptyModelInput(
  nodes: StudioNode[],
  edges: Edge[],
): StudioNode[] {
  return nodes.filter(
    (n) =>
      n.data.nodeId === "model-viewer" && !modelViewerHasModelInputEdge(n.id, edges),
  );
}

function sortNodesByFlowPositionProximity(
  nodes: StudioNode[],
  flowPosition: { x: number; y: number },
): StudioNode[] {
  return [...nodes].sort((a, b) => {
    const da = Math.hypot(a.position.x - flowPosition.x, a.position.y - flowPosition.y);
    const db = Math.hypot(b.position.x - flowPosition.x, b.position.y - flowPosition.y);
    return da - db;
  });
}

export function SensorStudioMain() {
  const persistedBootstrapRef = useRef(readPersistedFlowDocument());
  const { descriptors } = useStudioAssetDescriptors();
  const [bootViewport] = useState<StudioPersistedViewport | null>(() => {
    const raw = persistedBootstrapRef.current;
    const v = raw?.viewport;
    return v != null && isValidStudioPersistedViewport(v) ? v : null;
  });

  const theme = configService.getTheme().payload;
  const catalog = configService.getNodeCatalog().payload.nodes;
  const dataTypeColors = configService.getDataTypeColors().payload;
  const runtimeDefaults = configService.getRuntimeDefaults().payload;

  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const selectedNodeId = useFlowEditorStore((s) => s.selectedNodeId);
  const selectedNodeIds = useFlowEditorStore((s) => s.selectedNodeIds);
  const onNodesChange = useFlowEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowEditorStore((s) => s.onEdgesChange);
  const onConnect = useFlowEditorStore((s) => s.onConnect);
  const onSelectionChange = useFlowEditorStore((s) => s.onSelectionChange);
  const addNodeFromCatalog = useFlowEditorStore((s) => s.addNodeFromCatalog);
  const addNodeFromCatalogAt = useFlowEditorStore((s) => s.addNodeFromCatalogAt);
  const addNodeFromCatalogLinkedToModel = useFlowEditorStore(
    (s) => s.addNodeFromCatalogLinkedToModel,
  );
  const onClearCanvas = useFlowEditorStore((s) => s.resetCanvas);
  const onRunTemplate = useFlowEditorStore((s) => s.runDemoTemplate);
  const onUpdateLabel = useFlowEditorStore((s) => s.updateSelectedNodeLabel);
  const onUpdateConfigField = useFlowEditorStore((s) => s.updateSelectedNodeConfigField);
  const onUpdateConfigJson = useFlowEditorStore((s) => s.updateSelectedNodeConfigFromJson);
  const tickSimulation = useFlowEditorStore((s) => s.tickSimulation);
  useSensorStudioTelemetryFlowRefresh(tickSimulation);
  const undo = useFlowEditorStore((s) => s.undo);
  const redo = useFlowEditorStore((s) => s.redo);
  const hydrateFlowDocument = useFlowEditorStore((s) => s.hydrateFlowDocument);
  const duplicateSelection = useFlowEditorStore((s) => s.duplicateSelection);
  const deleteSelection = useFlowEditorStore((s) => s.deleteSelection);
  const selectAllNodes = useFlowEditorStore((s) => s.selectAllNodes);
  const clearNodeSelection = useFlowEditorStore((s) => s.clearNodeSelection);

  const onAddNode = useCallback(
    (entry: NodeCatalogEntry) => {
      const st = useFlowEditorStore.getState();
      const parentId = resolveSingleModelSelectParentId(st);
      if (parentId != null && catalogEntrySpawnsLinkedToModel(entry.id)) {
        const parent = st.nodes.find((n) => n.id === parentId);
        const position =
          parent != null
            ? { x: parent.position.x + 300, y: parent.position.y }
            : { x: 120, y: 120 };
        addNodeFromCatalogLinkedToModel(entry, position, {
          parentModelNodeId: parentId,
        });
        return;
      }
      addNodeFromCatalog(entry);
    },
    [addNodeFromCatalog, addNodeFromCatalogLinkedToModel],
  );

  const minimapCategoryColors = useMemo(
    (): Record<NodeCatalogEntry["category"], string> => ({
      sensor: "#34d399",
      input: "#64748b",
      transform: "#fbbf24",
      logic: "#a78bfa",
      output: "#22d3ee",
      utility: "#e879f9",
      generator: "#94a3b8",
    }),
    [],
  );

  const orderedSelectedNodes = useMemo((): StudioNode[] => {
    const ids =
      selectedNodeIds.length > 0
        ? selectedNodeIds
        : selectedNodeId != null
          ? [selectedNodeId]
          : [];
    if (ids.length === 0) {
      return [];
    }
    const map = new Map(nodes.map((n) => [n.id, n]));
    return ids.map((id) => map.get(id)).filter((n): n is StudioNode => n != null);
  }, [nodes, selectedNodeIds, selectedNodeId]);

  const selectedNode = orderedSelectedNodes[0] ?? null;
  const [templateId, setTemplateId] = useState<StudioDemoTemplateId>("signal-chain");
  const [deviceSensorSettingsOpen, setDeviceSensorSettingsOpen] = useState(false);
  const [deviceSensorSettingsInitialSourceId, setDeviceSensorSettingsInitialSourceId] =
    useState<number | null>(null);
  /** Values greater than zero trigger FlowCanvas fitView; zero preserves restored viewport on cold load. */
  const [fitViewVersion, setFitViewVersion] = useState(0);
  /** Apply viewport after JSON import without resetting React Flow (nonce bumps ReactFlow effect). */
  const [flowViewportApply, setFlowViewportApply] = useState<{
    nonce: number;
    viewport: Viewport;
  } | null>(null);
  const persistFingerprintRef = useRef<string>("");
  const viewportPersistRef = useRef<StudioPersistedViewport | null>(bootViewport);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const openDeviceSensorSettings = useCallback((initialSourceId: number | null) => {
    setDeviceSensorSettingsInitialSourceId(initialSourceId);
    setDeviceSensorSettingsOpen(true);
  }, []);

  const schedulePersistToStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      const st = useFlowEditorStore.getState();
      writePersistedFlowDocument({
        version: 1,
        nodes: st.nodes,
        edges: st.edges,
        selectedNodeId: st.selectedNodeId,
        selectedNodeIds:
          st.selectedNodeIds.length > 0 ? st.selectedNodeIds : undefined,
        viewport: viewportPersistRef.current ?? undefined,
      });
    }, 480);
  }, []);

  const onFlowViewportMoveEnd = useCallback(
    (viewport: Viewport) => {
      viewportPersistRef.current = {
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      };
      schedulePersistToStorage();
    },
    [schedulePersistToStorage],
  );

  const onDropPaletteCatalogNode = useCallback(
    (catalogNodeId: string, flowPosition: { x: number; y: number }) => {
      const entry = catalog.find((n) => n.id === catalogNodeId);
      if (entry == null) {
        return;
      }
      const st = useFlowEditorStore.getState();
      const parentId = resolveSingleModelSelectParentId(st);
      if (parentId != null && catalogEntrySpawnsLinkedToModel(entry.id)) {
        addNodeFromCatalogLinkedToModel(entry, flowPosition, {
          parentModelNodeId: parentId,
        });
        return;
      }
      addNodeFromCatalogAt(entry, flowPosition);
    },
    [addNodeFromCatalogAt, addNodeFromCatalogLinkedToModel, catalog],
  );

  const spawnGlbLinkedNumberConstant = useCallback(
    (parentModelFlowNodeId: string, row: StudioGltfExtractRow, position: { x: number; y: number }) => {
      const numberEntry = catalog.find((n) => n.id === "number-constant");
      if (numberEntry == null) {
        return;
      }
      const st = useFlowEditorStore.getState();
      const parent = st.nodes.find((n) => n.id === parentModelFlowNodeId);
      if (parent == null || parent.data.nodeId !== "model-select") {
        return;
      }
      addNodeFromCatalogLinkedToModel(numberEntry, position, {
        parentModelNodeId: parentModelFlowNodeId,
        flowNodeLabel: row.label,
        mergeDefaultConfig: {
          value: 0,
          [STUDIO_GLB_EXTRACT_KIND_KEY]: row.kind,
          [STUDIO_GLB_EXTRACT_REF_KEY]: row.ref,
        },
      });
    },
    [addNodeFromCatalogLinkedToModel, catalog],
  );

  const onSpawnGlbExtract = useCallback(
    (args: { parentModelFlowNodeId: string; row: StudioGltfExtractRow }) => {
      const st = useFlowEditorStore.getState();
      const parent = st.nodes.find((n) => n.id === args.parentModelFlowNodeId);
      const position =
        parent != null
          ? { x: parent.position.x + 300, y: parent.position.y }
          : { x: 120, y: 120 };
      spawnGlbLinkedNumberConstant(args.parentModelFlowNodeId, args.row, position);
    },
    [spawnGlbLinkedNumberConstant],
  );

  const onDropGlbExtract = useCallback(
    (payload: StudioGlbExtractDragPayloadV1, flowPosition: { x: number; y: number }) => {
      spawnGlbLinkedNumberConstant(
        payload.parentModelFlowNodeId,
        {
          kind: payload.kind,
          ref: payload.glbRef,
          label: payload.label,
        },
        flowPosition,
      );
    },
    [spawnGlbLinkedNumberConstant],
  );

  const onDropStudioAsset = useCallback(
    (payload: StudioAssetDragPayloadV1, flowPosition: { x: number; y: number }) => {
      const modelEntry = catalog.find((n) => n.id === "model-select");
      const viewerEntry = catalog.find((n) => n.id === "model-viewer");
      if (modelEntry == null) {
        return;
      }
      const d = getStudioModelDescriptorById(payload.studioAssetId, descriptors);
      if (d == null) {
        return;
      }
      const persisted = persistedModelUrlFromStudioDescriptor(d);
      const fetchUrl = resolveStudioModelGltfFetchUrl(
        { url: persisted, studioAssetId: d.id },
        descriptors,
        "",
      );
      const st = useFlowEditorStore.getState();
      const allEmptyViewers = findModelViewersWithEmptyModelInput(st.nodes, st.edges);
      const selectedEmpty = allEmptyViewers.filter((v) => st.selectedNodeIds.includes(v.id));
      const sortedEmpty =
        selectedEmpty.length === 1
          ? selectedEmpty
          : sortNodesByFlowPositionProximity(
              selectedEmpty.length > 0 ? selectedEmpty : allEmptyViewers,
              flowPosition,
            );
      const targetViewer = sortedEmpty[0] ?? null;
      const modelPosition =
        targetViewer != null
          ? {
              x: targetViewer.position.x - STUDIO_MODEL_TO_VIEWER_OFFSET_X,
              y: targetViewer.position.y,
            }
          : flowPosition;

      const modelNodeId = addNodeFromCatalogAt(modelEntry, modelPosition, {
        flowNodeLabel: payload.label,
        mergeDefaultConfig: {
          selectedStudioAssetId: d.id,
          selectedModelUrl: fetchUrl,
        },
      });

      const connectModelToViewer = (viewerId: string): void => {
        onConnect({
          source: modelNodeId,
          target: viewerId,
          sourceHandle: STUDIO_HANDLE_OUT,
          targetHandle: STUDIO_HANDLE_IN,
        });
      };

      if (targetViewer != null) {
        connectModelToViewer(targetViewer.id);
        return;
      }

      if (viewerEntry == null) {
        return;
      }
      addNodeFromCatalogLinkedToModel(
        viewerEntry,
        {
          x: modelPosition.x + STUDIO_VIEWER_TO_MODEL_OFFSET_X,
          y: modelPosition.y,
        },
        { parentModelNodeId: modelNodeId },
      );
      const viewerId = useFlowEditorStore.getState().selectedNodeId;
      if (viewerId != null) {
        connectModelToViewer(viewerId);
      }
    },
    [
      addNodeFromCatalogAt,
      addNodeFromCatalogLinkedToModel,
      catalog,
      descriptors,
      onConnect,
    ],
  );

  const runTemplateNow = useCallback(() => {
    onRunTemplate(templateId, catalog);
    setFitViewVersion((value) => value + 1);
  }, [catalog, onRunTemplate, templateId]);

  const runSpecificTemplate = useCallback((nextTemplateId: StudioDemoTemplateId) => {
    setTemplateId(nextTemplateId);
    onRunTemplate(nextTemplateId, catalog);
    setFitViewVersion((value) => value + 1);
  }, [catalog, onRunTemplate]);

  const clearNow = useCallback(() => {
    onClearCanvas();
  }, [onClearCanvas]);

  const requestFitView = useCallback(() => {
    setFitViewVersion((v) => v + 1);
  }, []);

  const onDuplicateFlowSelection = useCallback(() => {
    duplicateSelection();
  }, [duplicateSelection]);

  const onDeleteFlowSelection = useCallback(() => {
    deleteSelection();
  }, [deleteSelection]);

  const onSelectAllFlowNodes = useCallback(() => {
    selectAllNodes();
  }, [selectAllNodes]);

  const onClearFlowSelection = useCallback(() => {
    clearNodeSelection();
  }, [clearNodeSelection]);

  const onExportFlow = useCallback(() => {
    const json = useFlowEditorStore.getState().exportFlowGraphJson({
      viewport: viewportPersistRef.current ?? undefined,
    });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor-studio-flow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const onImportFlowPick = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  const onImportFlowFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file == null) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const r = useFlowEditorStore.getState().importFlowGraphJson(text);
        if (r.ok) {
          if (r.viewport != null) {
            viewportPersistRef.current = r.viewport;
            setFlowViewportApply({
              nonce: Date.now(),
              viewport: {
                x: r.viewport.x,
                y: r.viewport.y,
                zoom: r.viewport.zoom,
              },
            });
            schedulePersistToStorage();
          } else {
            setFitViewVersion((v) => v + 1);
          }
        }
      };
      reader.onerror = () => {};
      reader.readAsText(file);
    },
    [schedulePersistToStorage],
  );

  useEffect(() => {
    const raw = persistedBootstrapRef.current;
    viewportPersistRef.current = bootViewport;

    if (raw != null && raw.nodes.length > 0) {
      hydrateFlowDocument({
        nodes: raw.nodes as StudioNode[],
        edges: raw.edges as Edge[],
        selectedNodeId: raw.selectedNodeId,
        selectedNodeIds: raw.selectedNodeIds,
      });
      persistFingerprintRef.current = flowStructureFingerprint(
        raw.nodes as StudioNode[],
        raw.edges as Edge[],
        raw.selectedNodeId,
        raw.selectedNodeIds ?? (raw.selectedNodeId != null ? [raw.selectedNodeId] : []),
      );
      if (bootViewport == null) {
        setFitViewVersion((v) => v + 1);
      }
    } else {
      persistFingerprintRef.current = flowStructureFingerprint([], [], null, []);
    }

    const unsub = useFlowEditorStore.subscribe((state) => {
      const fp = flowStructureFingerprint(
        state.nodes,
        state.edges,
        state.selectedNodeId,
        state.selectedNodeIds,
      );
      if (fp === persistFingerprintRef.current) {
        return;
      }
      persistFingerprintRef.current = fp;
      schedulePersistToStorage();
    });
    return () => {
      unsub();
      window.clearTimeout(persistTimerRef.current);
    };
  }, [bootViewport, hydrateFlowDocument, schedulePersistToStorage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName.toLowerCase();
        const editable =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target.isContentEditable;
        if (editable) {
          return;
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearNodeSelection();
        return;
      }

      if (event.ctrlKey && !event.shiftKey && (event.key === "a" || event.key === "A")) {
        event.preventDefault();
        selectAllNodes();
        return;
      }

      if (event.ctrlKey && !event.shiftKey && (event.key === "d" || event.key === "D")) {
        event.preventDefault();
        duplicateSelection();
        return;
      }

      if (event.ctrlKey && event.shiftKey && (event.key === "f" || event.key === "F")) {
        event.preventDefault();
        requestFitView();
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key === "1") {
        event.preventDefault();
        runSpecificTemplate("basic-indicator");
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key === "2") {
        event.preventDefault();
        runSpecificTemplate("gauge-monitor");
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key === "3") {
        event.preventDefault();
        runSpecificTemplate("signal-chain");
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key === "4") {
        event.preventDefault();
        runSpecificTemplate("bmi270-gauge-z");
        return;
      }

      if (event.ctrlKey && event.shiftKey && (event.key === "e" || event.key === "E")) {
        event.preventDefault();
        onExportFlow();
        return;
      }

      if (event.ctrlKey && event.shiftKey && (event.key === "i" || event.key === "I")) {
        event.preventDefault();
        onImportFlowPick();
        return;
      }

      if (event.ctrlKey && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if (event.ctrlKey && event.key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.ctrlKey && (event.key === "y" || event.key === "Y")) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.ctrlKey && !event.shiftKey && event.key === "1") {
        event.preventDefault();
        runTemplateNow();
        return;
      }

      if (event.ctrlKey && event.key === "Backspace") {
        event.preventDefault();
        clearNow();
        return;
      }

      if (event.ctrlKey && event.key === "2") {
        event.preventDefault();
        setTemplateId("gauge-monitor");
        return;
      }

      if (event.ctrlKey && event.key === "3") {
        event.preventDefault();
        setTemplateId("signal-chain");
        return;
      }

      if (event.ctrlKey && event.key === "4") {
        event.preventDefault();
        setTemplateId("basic-indicator");
        return;
      }

      if (event.ctrlKey && event.key === "5") {
        event.preventDefault();
        setTemplateId("bmi270-gauge-z");
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    templateId,
    catalog,
    onRunTemplate,
    onClearCanvas,
    runSpecificTemplate,
    runTemplateNow,
    clearNow,
    undo,
    redo,
    onExportFlow,
    onImportFlowPick,
    duplicateSelection,
    selectAllNodes,
    clearNodeSelection,
    requestFitView,
  ]);

  useEffect(() => {
    let rafId = 0;
    let prevSampleCount = useBitstreamLiveStore.getState().sampleCount;
    let prevQuatSeq = useBmi270FusionQuatWireTapStore.getState().seq;
    let prevEulerSeq = useBmi270FusionEulerWireTapStore.getState().seq;

    const runTick = () => {
      tickSimulation();
    };

    const scheduleTick = () => {
      if (rafId !== 0) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        runTick();
      });
    };

    const unsubscribeLive = useBitstreamLiveStore.subscribe((state) => {
      if (state.sampleCount !== prevSampleCount) {
        prevSampleCount = state.sampleCount;
        scheduleTick();
      }
    });
    const unsubscribeQuatWire = useBmi270FusionQuatWireTapStore.subscribe((state) => {
      if (state.seq !== prevQuatSeq) {
        prevQuatSeq = state.seq;
        scheduleTick();
      }
    });
    const unsubscribeEulerWire = useBmi270FusionEulerWireTapStore.subscribe((state) => {
      if (state.seq !== prevEulerSeq) {
        prevEulerSeq = state.seq;
        scheduleTick();
      }
    });

    runTick();

    return () => {
      unsubscribeLive();
      unsubscribeQuatWire();
      unsubscribeEulerWire();
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [tickSimulation]);

  return (
    <>
      <input
        ref={importFileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-hidden="true"
        onChange={onImportFlowFile}
      />
      <StudioLayout
        canvasBackgroundColor={theme.color.background.canvas}
        panelBackgroundColor={theme.color.background.panel}
        borderColor={theme.color.border.default}
        primaryTextColor={theme.color.text.primary}
        secondaryTextColor={theme.color.text.secondary}
        numberColor={dataTypeColors.number}
        booleanColor={dataTypeColors.boolean}
        stringColor={dataTypeColors.string}
        eventColor={dataTypeColors.event}
        vector3Color={dataTypeColors.vector3}
        quaternionColor={dataTypeColors.quaternion}
        environmentColor={dataTypeColors.environment}
        cameraColor={dataTypeColors.camera}
        glbAnimationColor={dataTypeColors.glbAnimation}
        minimapCategoryColors={minimapCategoryColors}
        entries={catalog}
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode}
        orderedSelectedNodes={orderedSelectedNodes}
        onAddNode={onAddNode}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onUpdateLabel={onUpdateLabel}
        onUpdateConfigField={onUpdateConfigField}
        onUpdateConfigJson={onUpdateConfigJson}
        templateId={templateId}
        onTemplateIdChange={setTemplateId}
        onRunTemplate={runTemplateNow}
        onClearCanvas={clearNow}
        onExportFlow={onExportFlow}
        onImportFlowPick={onImportFlowPick}
        deviceSensorSettingsOpen={deviceSensorSettingsOpen}
        onDeviceSensorSettingsOpenChange={setDeviceSensorSettingsOpen}
        deviceSensorSettingsInitialSourceId={deviceSensorSettingsInitialSourceId}
        onOpenDeviceSensorSettings={openDeviceSensorSettings}
        fitViewVersion={fitViewVersion}
        initialFlowViewport={bootViewport}
        onFlowViewportMoveEnd={onFlowViewportMoveEnd}
        applyFlowViewport={flowViewportApply?.viewport ?? null}
        applyFlowViewportNonce={flowViewportApply?.nonce ?? 0}
        onDuplicateSelection={onDuplicateFlowSelection}
        onDeleteSelection={onDeleteFlowSelection}
        onFitView={requestFitView}
        onSelectAllNodes={onSelectAllFlowNodes}
        onClearCanvasSelection={onClearFlowSelection}
        onDropPaletteCatalogNode={onDropPaletteCatalogNode}
        onSpawnGlbExtract={onSpawnGlbExtract}
        onDropGlbExtract={onDropGlbExtract}
        onDropStudioAsset={onDropStudioAsset}
      />
    </>
  );
}
