import type {
  Edge,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  Viewport,
} from "@xyflow/react";
import type { NodeCatalogEntry } from "../../core/config/config-types";
import type { StudioGltfExtractRow } from "./gltf/studio-gltf-extract";
import type { StudioAssetDragPayloadV1 } from "../asset-browser/studio-asset-drag";
import type { StudioGlbExtractDragPayloadV1 } from "./components/node-palette/glb-extract-drag";
import type { StudioDemoTemplateId, StudioNode } from "./store/flow-editor.store";

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
  minimapCategoryColors: Record<NodeCatalogEntry["category"], string>;
  entries: NodeCatalogEntry[];
  nodes: StudioNode[];
  edges: Edge[];
  selectedNode: StudioNode | null;
  /** Flow selection order; length 0 = none, 1 = single, 2+ = multi (inspector shows Live table). */
  orderedSelectedNodes: StudioNode[];
  onAddNode: (entry: NodeCatalogEntry) => void;
  onNodesChange: OnNodesChange<StudioNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  onSelectionChange: (selectedNodeIds: string[]) => void;
  onUpdateLabel: (nextLabel: string) => void;
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
  /** Canvas drop for GLB extraction rows (custom MIME payload from the Library GLB tab). */
  onDropGlbExtract?: (
    payload: StudioGlbExtractDragPayloadV1,
    flowPosition: { x: number; y: number },
  ) => void;
  onDropStudioAsset?: (
    payload: StudioAssetDragPayloadV1,
    flowPosition: { x: number; y: number },
  ) => void;
};
