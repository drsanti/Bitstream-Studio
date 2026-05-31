import type {
  Edge,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  Viewport,
} from "@xyflow/react";
import type { RefObject } from "react";
import type { NodeCatalogEntry, NodePaletteLayoutMode } from "../../core/config/config-types";
import type { StudioGltfExtractRow } from "./gltf/studio-gltf-extract";
import type { StudioAssetDragPayloadV1 } from "../asset-browser/studio-asset-drag";
import type { StudioGlbExtractDragPayloadV1 } from "./components/node-palette/glb-extract-drag";
import type { FlowCanvasGraphHandle } from "./components/flow-canvas-graph-handle";
import type { StudioDemoTemplateId, FlowGraphNode, StudioNode } from "./store/flow-editor.store";
import type { FlowCanvasPreferences } from "./components/flow-canvas-ui-persistence";

/** Props for `StudioLayout` and the Sensor Studio workbench panel context. */
export type StudioLayoutProps = {
  canvasBackgroundColor: string;
  panelBackgroundColor: string;
  borderColor: string;
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
  entries: NodeCatalogEntry[];
  nodes: FlowGraphNode[];
  edges: Edge[];
  selectedNode: FlowGraphNode | null;
  /** Flow selection order; length 0 = none, 1 = single, 2+ = multi (inspector shows Live table). */
  orderedSelectedNodes: FlowGraphNode[];
  onAddNode: (entry: NodeCatalogEntry) => void;
  /** Spawn a catalog node at flow coordinates (Shift+A menu, same rules as canvas drop). */
  onAddCatalogEntryAtFlowPosition?: (
    entry: NodeCatalogEntry,
    flowPosition: { x: number; y: number },
  ) => void;
  /** Imperative flow canvas API (Shift+A toggle, menu anchor). */
  flowCanvasGraphRef?: RefObject<FlowCanvasGraphHandle | null>;
  onNodesChange: OnNodesChange<StudioNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onSelectionChange: (selectedNodeIds: string[]) => void;
  onUpdateLabel: (nextLabel: string) => void;
  onUpdateNodeUiResizable: (resizable: boolean) => void;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  onUpdateConfigJson: (nextJson: string) => { ok: true } | { ok: false; message: string };
  templateId: StudioDemoTemplateId;
  onTemplateIdChange: (templateId: StudioDemoTemplateId) => void;
  onRunTemplate: () => void;
  onClearCanvas: () => void;
  onDuplicateSelection?: () => void;
  onDeleteSelection?: () => void;
  onFitView?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvasSelection?: () => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
  /** Live canvas pan/zoom (updated after viewport settles). */
  flowViewport?: Viewport | null;
  /** Apply persisted viewport without remounting React Flow. */
  onRestoreFlowViewport?: () => void;
  /** Reset workbench pane split layout (provided by StudioLayout). */
  onResetWorkspaceLayout?: () => void;
  flowCanvasPreferences: FlowCanvasPreferences;
  onFlowCanvasPreferencesChange: (patch: Partial<FlowCanvasPreferences>) => void;
  /** Empty flow canvas clicks — **On Click** event sources. */
  onFlowPanePointerEvent?: (event: { button: number }) => void;
  deviceSensorSettingsOpen?: boolean;
  onDeviceSensorSettingsOpenChange?: (open: boolean) => void;
  deviceSensorSettingsInitialSourceId?: number | null;
  onOpenDeviceSensorSettings?: (initialSourceId: number | null) => void;
  fitViewVersion: number;
  initialFlowViewport?: Viewport | null;
  onFlowViewportMoveEnd?: (viewport: Viewport) => void;
  applyFlowViewport?: Viewport | null;
  applyFlowViewportNonce?: number;
  onDropPaletteCatalogNode?: (
    catalogNodeId: string,
    flowPosition: { x: number; y: number },
  ) => void;
  /** GLB Library tab: spawn a linked placeholder node for an extracted row. */
  onSpawnGlbExtract?: (args: { parentModelFlowNodeId: string; row: StudioGltfExtractRow }) => void;
  /** GLB Library **Materials** tab: spawn **GLB Material Texture** for a material row. */
  onSpawnGlbMaterialTextureExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** GLB Library **Materials** tab: spawn **GLB Material Color** for a material row. */
  onSpawnGlbMaterialColorExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** GLB Library **Parts** tab: spawn **Toggle GLB Part** event action for a part row. */
  onSpawnGlbEventPartExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** GLB Library **Animations** tab: spawn **Trigger GLB Anim** for an animation row. */
  onSpawnGlbEventAnimExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** Canvas drop for GLB extraction rows (custom MIME payload from the Library GLB tab). */
  onDropGlbExtract?: (
    payload: StudioGlbExtractDragPayloadV1,
    flowPosition: { x: number; y: number },
  ) => void;
  onDropStudioAsset?: (
    payload: StudioAssetDragPayloadV1,
    flowPosition: { x: number; y: number },
  ) => void;
  /** Runtime default for Library palette layout (`runtime-defaults.config.ts`). */
  defaultPaletteLayout?: NodePaletteLayoutMode;
};
