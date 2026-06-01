/**
 * @ternion/trn-workbench — public API
 * Copy the entire `TRNworkbench/` folder into another React + Tailwind 4 project.
 */

// Components
export {
  TRNWorkbench,
  type TRNWorkbenchProps,
  type TRNWorkbenchHandle,
} from './TRNWorkbench';
export { TRNWorkbenchHost, type TRNWorkbenchHostProps } from './TRNWorkbenchHost';
export {
  TRNManagedWorkbench,
  type TRNManagedWorkbenchProps,
} from './TRNManagedWorkbench';
export { FloatingWorkbenchLayer } from './FloatingWorkbenchLayer';
export { FloatingWorkbenchPaneWindow } from './FloatingWorkbenchPane';

// Hooks
export {
  useWorkbenchFloating,
  type UseWorkbenchFloatingOptions,
  type WorkbenchFloatingBindings,
} from './useWorkbenchFloating';

// Types
export type {
  LayoutNode,
  EditorType,
  CollapseEdge,
  WorkbenchRegistry,
} from './types';
export type { FloatingWorkbenchPane } from './floatingTypes';
export type { PaneDockZone, PaneDockDragState, PaneDockHoverState } from './paneDock';

// Layout tree utilities
export {
  findEditorNode,
  isCollapsedEditor,
  collapseEditorPane,
  expandEditorPane,
  splitNode,
  closeNode,
  changeNodeType,
  dockEditorPane,
  dockEditorPaneAtWorkbenchEdge,
  dockExtractedEditorPane,
  dockExtractedEditorAtWorkbenchEdge,
  canCloseEditorPane,
  extractEditorPane,
  updateNodeRatio,
  updateNodeRatioAndSyncEditors,
  setTabsActiveIndex,
  collectCollapsedEditorIds,
  WORKBENCH_EDGE_DOCK_RATIO,
  type EditorLayoutNode,
} from './utils';

export {
  collectEditorPanes,
  countEditorPanes,
  findEditorPane,
  removeEditorPane,
  replaceEditorPane,
  mapLayout,
  directSplitChildEditorType,
} from './layoutTraversal';

export { createEditorPane, createSplit, createTabs } from './layoutBuilders';

export {
  validateLayoutTree,
  type ValidateLayoutTreeOptions,
} from './layoutValidateCore';

export {
  loadPersistedLayout,
  savePersistedLayout,
  clearPersistedLayout,
  workbenchPersistenceKey,
} from './layoutPersistence';

export {
  DEFAULT_FLOAT_PANE_WIDTH,
  DEFAULT_FLOAT_PANE_HEIGHT,
  MIN_FLOAT_PANE_WIDTH,
  MIN_FLOAT_PANE_HEIGHT,
  FLOAT_DETACH_MARGIN_PX,
  isPointerOutsideElement,
  floatPanePositionFromPointer,
  clampFloatSize,
} from './workbenchFloat';

export { cn } from './cn';

export {
  StandaloneWorkbench,
  type StandaloneWorkbenchHandle,
  type StandaloneWorkbenchProps,
} from './StandaloneWorkbench';

export { createWorkbenchLayoutValidator } from './create-workbench-layout-validator';

export { WorkbenchCommandOverlay } from './WorkbenchCommandOverlay';
export { WorkbenchSaveLayoutDialog } from './WorkbenchSaveLayoutDialog';
export { WorkbenchLayoutMenu } from './WorkbenchLayoutMenu';
export { WorkbenchLayoutLibraryPanel } from './WorkbenchLayoutLibraryPanel';
export type { WorkbenchLayoutMenuProps } from './workbench-layout-menu.types';
export {
  readWorkbenchLayoutLibrary,
  writeWorkbenchLayoutLibrary,
  saveNamedWorkbenchLayout,
  deleteNamedWorkbenchLayout,
  listNamedWorkbenchLayouts,
  listNamedWorkbenchLayoutsSorted,
  getNamedWorkbenchLayout,
  findNamedWorkbenchLayoutByName,
  normalizeWorkbenchLayoutName,
  summarizeWorkbenchLayoutPanes,
  renameNamedWorkbenchLayout,
  duplicateNamedWorkbenchLayout,
  reorderNamedWorkbenchLayout,
  readWorkbenchStartupPreference,
  writeWorkbenchStartupPreference,
  createWorkbenchLayoutSnapshotFromCurrent,
  serializeWorkbenchLayoutExport,
  parseWorkbenchLayoutImport,
  importWorkbenchLayoutToLibrary,
  downloadWorkbenchLayoutJson,
  workbenchStartupPreferenceStorageKey,
  MAX_NAMED_WORKBENCH_LAYOUTS,
  WORKBENCH_LAYOUT_LIBRARY_VERSION,
  type WorkbenchLayoutSnapshotV1,
  type WorkbenchLayoutLibraryV1,
  type WorkbenchLayoutPreset,
  type WorkbenchStartupPreference,
  type SaveWorkbenchLayoutResult,
  type WorkbenchLayoutExportV1,
} from './workbench-layout-library';
export {
  useManagedWorkbench,
  type UseManagedWorkbenchOptions,
  type WorkbenchPaneCommand,
  type WorkbenchCommandRunResult,
} from './use-managed-workbench';
export { useWorkbenchKeyboardShortcuts } from './use-workbench-keyboard-shortcuts';

export {
  pushLayoutHistory,
  undoLayout,
  redoLayout,
  canUndoLayout,
  canRedoLayout,
  clearLayoutHistory,
  runWithoutLayoutHistory,
} from './layout-history';

export {
  resolveDockSplitRatio,
  rememberDockSplitRatio,
  rememberSplitResizeRatio,
  rememberWorkbenchEdgeRatio,
  resolveWorkbenchEdgeRatio,
  type WorkbenchDockSizeMemory,
} from './workbench-dock-size-memory';

export {
  cycleCollapsedPaneFocus,
  resolveCollapseTargetPaneId,
  resolveExpandTargetPaneId,
  applyWorkbenchCollapse,
  applyWorkbenchExpand,
} from './workbench-keyboard';

// Dock / overlay helpers (advanced integrations)
export {
  PANE_DOCK_ZONE_HIT_PX,
  WORKBENCH_GLOBAL_DOCK_EDGE_PX,
  workbenchGlobalZoneAtPoint,
} from './paneDock';
