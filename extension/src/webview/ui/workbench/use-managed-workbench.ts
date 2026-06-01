import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { TRNCommandPaletteItem } from "../TRN/TRNCommandPalette.js";
import {
  clearPersistedDockSizeMemory,
  loadPersistedDockSizeMemory,
  savePersistedDockSizeMemory,
} from "./dock-size-persistence";
import {
  canRedoLayout,
  canUndoLayout,
  clearLayoutHistory,
  pushLayoutHistory,
  redoLayout,
  runWithoutLayoutHistory,
  undoLayout,
} from "./layout-history";
import { collectEditorPanes } from "./layoutTraversal";
import type { LayoutNode } from "./types";
import type { PaneDockZone } from "./paneDock";
import {
  clearPersistedLayout,
  loadPersistedLayout,
  savePersistedLayout,
} from "./layoutPersistence";
import {
  applyWorkbenchCollapse,
  applyWorkbenchExpand,
  cycleCollapsedPaneFocus,
  resolveCollapseTargetPaneId,
  resolveExpandTargetPaneId,
} from "./workbench-keyboard";
import {
  rememberDockSplitRatio,
  rememberSplitResizeRatio,
  rememberWorkbenchEdgeRatio,
  resolveDockSplitRatio,
  resolveWorkbenchEdgeRatio,
  type WorkbenchDockSizeMemory,
} from "./workbench-dock-size-memory";
import {
  collapseEditorPane,
  expandEditorPane,
  findEditorPaneId,
  findEditorNode,
  splitNodeWithEditor,
  WORKBENCH_EDGE_DOCK_RATIO,
  collectCollapsedEditorIds,
} from "./utils";
import type { TRNWorkbenchProps } from "./TRNWorkbench";
import {
  deleteNamedWorkbenchLayout,
  getNamedWorkbenchLayout,
  listNamedWorkbenchLayoutsSorted,
  readWorkbenchStartupPreference,
  type WorkbenchLayoutPreset,
  type WorkbenchStartupPreference,
} from "./workbench-layout-library";

export type WorkbenchPaneCommand = {
  editorType: string;
  label: string;
  keywords?: string;
};

export type UseManagedWorkbenchOptions = {
  initialLayout: LayoutNode;
  persistenceKey?: string;
  validateLayout?: (raw: unknown) => LayoutNode;
  /** Editor types treated as side panels for collapse/expand-all commands. */
  sidePanelEditorTypes?: readonly string[];
  paneCommands?: readonly WorkbenchPaneCommand[];
  layoutPresets?: readonly WorkbenchLayoutPreset[];
  /** Defaults to `persistenceKey` when set. */
  layoutLibraryAppId?: string;
  /** Clear floating panes when applying a saved layout or preset. */
  onClearFloatingPanes?: () => void;
};

function resolveInitialWorkbenchState(input: {
  initialLayout: LayoutNode;
  persistenceKey?: string;
  validateLayout?: (raw: unknown) => LayoutNode;
  layoutPresets: readonly WorkbenchLayoutPreset[];
}): { layout: LayoutNode; dockMemory: WorkbenchDockSizeMemory } {
  if (input.persistenceKey == null || typeof window === "undefined") {
    return { layout: input.initialLayout, dockMemory: {} };
  }

  const startup = readWorkbenchStartupPreference(input.persistenceKey);
  if (startup.kind === "preset") {
    const preset = input.layoutPresets.find((row) => row.id === startup.presetId);
    if (preset) {
      return {
        layout: input.validateLayout
          ? input.validateLayout(preset.layout)
          : preset.layout,
        dockMemory: {},
      };
    }
  }
  if (startup.kind === "named") {
    const snapshot = getNamedWorkbenchLayout(input.persistenceKey, startup.layoutId);
    if (snapshot) {
      return {
        layout: input.validateLayout
          ? input.validateLayout(snapshot.layout)
          : snapshot.layout,
        dockMemory: structuredClone(snapshot.dockMemory ?? {}),
      };
    }
  }

  const saved = loadPersistedLayout(input.persistenceKey);
  if (saved != null) {
    return {
      layout: input.validateLayout ? input.validateLayout(saved) : saved,
      dockMemory: loadPersistedDockSizeMemory(input.persistenceKey),
    };
  }
  return { layout: input.initialLayout, dockMemory: {} };
}

export type WorkbenchCommandRunResult =
  | { kind: "handled" }
  | { kind: "open-save-dialog" }
  | { kind: "open-manage-panel" }
  | { kind: "trigger-import" }
  | { kind: "export-current" }
  | { kind: "confirm-delete"; layoutId: string; layoutName: string };

export function useManagedWorkbench({
  initialLayout,
  persistenceKey,
  validateLayout,
  sidePanelEditorTypes = [],
  paneCommands = [],
  layoutPresets = [],
  layoutLibraryAppId,
  onClearFloatingPanes,
}: UseManagedWorkbenchOptions) {
  const libraryAppId = layoutLibraryAppId ?? persistenceKey;
  const [libraryRevision, setLibraryRevision] = useState(0);
  const initialWorkbenchState = useMemo(
    () =>
      resolveInitialWorkbenchState({
        initialLayout,
        persistenceKey,
        validateLayout,
        layoutPresets,
      }),
    [initialLayout, layoutPresets, persistenceKey, validateLayout],
  );
  const [layout, setLayoutState] = useState<LayoutNode>(() => initialWorkbenchState.layout);
  const [layoutCanUndo, setLayoutCanUndo] = useState(false);
  const [layoutCanRedo, setLayoutCanRedo] = useState(false);
  const [activePaneId, setActivePaneId] = useState<string | null>(null);
  const [collapsedRailFocusId, setCollapsedRailFocusId] = useState<string | null>(null);
  const [dockMemory, setDockMemory] = useState<WorkbenchDockSizeMemory>(
    () => initialWorkbenchState.dockMemory,
  );
  const [startupPreference, setStartupPreferenceState] = useState<WorkbenchStartupPreference>(
    () =>
      libraryAppId != null && typeof window !== "undefined"
        ? readWorkbenchStartupPreference(libraryAppId)
        : { kind: "session" },
  );

  const syncHistoryFlags = useCallback(() => {
    setLayoutCanUndo(canUndoLayout());
    setLayoutCanRedo(canRedoLayout());
  }, []);

  const setLayout = useCallback(
    (action: SetStateAction<LayoutNode>, recordHistory = true) => {
      setLayoutState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        if (next === prev) {
          return prev;
        }
        if (recordHistory) {
          pushLayoutHistory(prev);
        }
        syncHistoryFlags();
        return next;
      });
    },
    [syncHistoryFlags],
  );

  useEffect(() => {
    if (persistenceKey == null || typeof window === "undefined") {
      return;
    }
    savePersistedLayout(persistenceKey, layout);
  }, [layout, persistenceKey]);

  useEffect(() => {
    if (persistenceKey == null || typeof window === "undefined") {
      return;
    }
    savePersistedDockSizeMemory(persistenceKey, dockMemory);
  }, [dockMemory, persistenceKey]);

  const applyLayoutSnapshot = useCallback(
    (nextLayout: LayoutNode, nextDockMemory: WorkbenchDockSizeMemory = {}) => {
      onClearFloatingPanes?.();
      runWithoutLayoutHistory(() => {
        const validated = validateLayout ? validateLayout(nextLayout) : nextLayout;
        setLayoutState(validated);
        setDockMemory(structuredClone(nextDockMemory));
        setActivePaneId(null);
        setCollapsedRailFocusId(null);
      });
      syncHistoryFlags();
    },
    [onClearFloatingPanes, syncHistoryFlags, validateLayout],
  );

  const loadLayoutPreset = useCallback(
    (presetId: string) => {
      const preset = layoutPresets.find((row) => row.id === presetId);
      if (!preset) {
        return false;
      }
      applyLayoutSnapshot(preset.layout, {});
      return true;
    },
    [applyLayoutSnapshot, layoutPresets],
  );

  const loadNamedLayout = useCallback(
    (layoutId: string) => {
      if (!libraryAppId) {
        return false;
      }
      const snapshot = getNamedWorkbenchLayout(libraryAppId, layoutId);
      if (!snapshot) {
        return false;
      }
      applyLayoutSnapshot(snapshot.layout, snapshot.dockMemory ?? {});
      return true;
    },
    [applyLayoutSnapshot, libraryAppId],
  );

  const deleteNamedLayout = useCallback(
    (layoutId: string) => {
      if (!libraryAppId) {
        return false;
      }
      const deleted = deleteNamedWorkbenchLayout(libraryAppId, layoutId);
      if (deleted) {
        setLibraryRevision((value) => value + 1);
      }
      return deleted;
    },
    [libraryAppId],
  );

  const bumpLibraryRevision = useCallback(() => {
    setLibraryRevision((value) => value + 1);
    if (libraryAppId != null && typeof window !== "undefined") {
      setStartupPreferenceState(readWorkbenchStartupPreference(libraryAppId));
    }
  }, [libraryAppId]);

  const resetLayout = useCallback(() => {
    if (persistenceKey != null && typeof window !== "undefined") {
      clearPersistedLayout(persistenceKey);
      clearPersistedDockSizeMemory(persistenceKey);
    }
    clearLayoutHistory();
    runWithoutLayoutHistory(() => {
      setLayoutState(initialLayout);
      setDockMemory({});
      setActivePaneId(null);
      setCollapsedRailFocusId(null);
    });
    syncHistoryFlags();
  }, [initialLayout, persistenceKey, syncHistoryFlags]);

  const undoLayoutChange = useCallback(() => {
    setLayoutState((current) => {
      const prev = undoLayout(current);
      if (!prev) {
        return current;
      }
      syncHistoryFlags();
      return prev;
    });
  }, [syncHistoryFlags]);

  const redoLayoutChange = useCallback(() => {
    setLayoutState((current) => {
      const next = redoLayout(current);
      if (!next) {
        return current;
      }
      syncHistoryFlags();
      return next;
    });
  }, [syncHistoryFlags]);

  const collapseActivePane = useCallback(() => {
    const target = resolveCollapseTargetPaneId(layout, activePaneId);
    if (!target) {
      return;
    }
    setLayout(applyWorkbenchCollapse(layout, target));
    setCollapsedRailFocusId(target);
  }, [activePaneId, layout, setLayout]);

  const expandPaneTarget = useCallback(() => {
    const target = resolveExpandTargetPaneId(layout, activePaneId, collapsedRailFocusId);
    if (!target) {
      return;
    }
    setLayout(applyWorkbenchExpand(layout, target));
    setActivePaneId(target);
    setCollapsedRailFocusId(null);
  }, [activePaneId, collapsedRailFocusId, layout, setLayout]);

  const cycleCollapsedRailFocus = useCallback(
    (direction: 1 | -1) => {
      const collapsed = collectCollapsedEditorIds(layout);
      const nextFocus = cycleCollapsedPaneFocus(collapsed, collapsedRailFocusId, direction);
      if (nextFocus) {
        setCollapsedRailFocusId(nextFocus);
      }
    },
    [collapsedRailFocusId, layout],
  );

  const focusOrOpenPane = useCallback(
    (editorType: string) => {
      let nextLayout = layout;
      const existingId = findEditorPaneId(nextLayout, editorType);
      if (existingId) {
        const editor = findEditorNode(nextLayout, existingId);
        if (editor?.collapsed) {
          nextLayout = expandEditorPane(nextLayout, existingId);
          setLayout(nextLayout, false);
        }
        setActivePaneId(existingId);
        setCollapsedRailFocusId(null);
        return;
      }

      const anchor =
        activePaneId && findEditorNode(nextLayout, activePaneId)
          ? activePaneId
          : (findEditorPaneId(nextLayout, paneCommands[0]?.editorType ?? "flow") ??
            collectEditorPanes(nextLayout)[0]?.id);

      if (!anchor) {
        return;
      }

      nextLayout = splitNodeWithEditor(nextLayout, anchor, "horizontal", editorType, 0.55);
      setLayout(nextLayout);
      const newId = findEditorPaneId(nextLayout, editorType);
      if (newId) {
        setActivePaneId(newId);
        setCollapsedRailFocusId(null);
      }
    },
    [activePaneId, layout, paneCommands, setLayout],
  );

  const collapseSidePanels = useCallback(() => {
    let next = layout;
    const panes = collectEditorPanes(next).filter(
      (pane) => sidePanelEditorTypes.includes(pane.editorType) && !pane.collapsed,
    );
    if (panes.length === 0) {
      return;
    }
    for (const pane of panes) {
      next = collapseEditorPane(next, pane.id);
    }
    setLayout(next);
  }, [layout, setLayout, sidePanelEditorTypes]);

  const expandSidePanels = useCallback(() => {
    let next = layout;
    const panes = collectEditorPanes(next).filter(
      (pane) => sidePanelEditorTypes.includes(pane.editorType) && pane.collapsed,
    );
    if (panes.length === 0) {
      return;
    }
    for (const pane of panes) {
      next = expandEditorPane(next, pane.id);
    }
    setLayout(next);
  }, [layout, setLayout, sidePanelEditorTypes]);

  const duplicateActivePane = useCallback(() => {
    if (!activePaneId) {
      return;
    }
    const editor = findEditorNode(layout, activePaneId);
    if (!editor || editor.collapsed) {
      return;
    }
    const next = splitNodeWithEditor(layout, activePaneId, "horizontal", editor.editorType, 0.5);
    setLayout(next);
    const newId = findEditorPaneId(next, editor.editorType);
    if (newId && newId !== activePaneId) {
      setActivePaneId(newId);
    }
  }, [activePaneId, layout, setLayout]);

  const commandItems = useMemo((): TRNCommandPaletteItem[] => {
    const presetItems: TRNCommandPaletteItem[] = layoutPresets.map((preset) => ({
      id: `preset-${preset.id}`,
      group: "Presets",
      label: `Layout: ${preset.label}`,
      keywords: `${preset.id} ${preset.description} preset layout`,
    }));

    const namedLayouts =
      libraryAppId != null ? listNamedWorkbenchLayoutsSorted(libraryAppId) : [];

    const myLayoutItems: TRNCommandPaletteItem[] = namedLayouts.flatMap((row) => [
      {
        id: `load-layout-${row.id}`,
        group: "My layouts",
        label: `Load: ${row.name}`,
        keywords: `${row.name} saved layout load`,
      },
      {
        id: `delete-layout-${row.id}`,
        group: "My layouts",
        label: `Delete: ${row.name}`,
        keywords: `${row.name} saved layout delete remove`,
      },
    ]);

    const libraryItems: TRNCommandPaletteItem[] =
      libraryAppId != null
        ? [
            {
              id: "layout-save-as",
              group: "Layout library",
              label: "Save current layout as…",
              keywords: "save layout library named",
            },
            {
              id: "layout-manage",
              group: "Layout library",
              label: "Manage layouts…",
              keywords: "manage rename duplicate reorder startup",
            },
            {
              id: "layout-export-current",
              group: "Layout library",
              label: "Export current layout…",
              keywords: "export layout json download",
            },
            {
              id: "layout-import",
              group: "Layout library",
              label: "Import layout…",
              keywords: "import layout json upload",
            },
          ]
        : [];

    const layoutItems: TRNCommandPaletteItem[] = [
      {
        id: "layout-undo",
        group: "Layout",
        label: "Undo layout change",
        shortcut: "Ctrl+Alt+Z",
        disabled: !layoutCanUndo,
        keywords: "undo layout",
      },
      {
        id: "layout-redo",
        group: "Layout",
        label: "Redo layout change",
        shortcut: "Ctrl+Alt+Shift+Z",
        disabled: !layoutCanRedo,
        keywords: "redo layout",
      },
      {
        id: "layout-reset",
        group: "Layout",
        label: "Reset workbench layout",
        keywords: "reset default layout",
      },
      {
        id: "layout-collapse-active",
        group: "Layout",
        label: "Collapse active pane",
        shortcut: "Ctrl+Shift+C",
        keywords: "collapse hide rail",
      },
      {
        id: "layout-expand-target",
        group: "Layout",
        label: "Expand collapsed pane",
        shortcut: "Ctrl+Shift+E",
        keywords: "expand show rail",
      },
      {
        id: "layout-collapse-sides",
        group: "Layout",
        label: "Collapse side panels",
        keywords: "collapse sides hide",
      },
      {
        id: "layout-expand-sides",
        group: "Layout",
        label: "Expand side panels",
        keywords: "expand sides show",
      },
      {
        id: "layout-duplicate-pane",
        group: "Layout",
        label: "Duplicate active pane",
        shortcut: "Ctrl+Shift+D",
        keywords: "duplicate clone split",
      },
    ];

    const paneItems: TRNCommandPaletteItem[] = paneCommands.map((pane) => ({
      id: `open-${pane.editorType}`,
      group: "Panes",
      label: pane.label,
      keywords: pane.keywords ?? pane.editorType,
    }));

    return [...presetItems, ...libraryItems, ...myLayoutItems, ...layoutItems, ...paneItems];
  }, [
    layoutCanRedo,
    layoutCanUndo,
    layoutPresets,
    libraryAppId,
    libraryRevision,
    paneCommands,
  ]);

  const runCommand = useCallback(
    (commandId: string, floatActivePane?: () => void): WorkbenchCommandRunResult => {
      if (commandId.startsWith("preset-")) {
        loadLayoutPreset(commandId.slice("preset-".length));
        return { kind: "handled" };
      }
      if (commandId.startsWith("load-layout-")) {
        loadNamedLayout(commandId.slice("load-layout-".length));
        return { kind: "handled" };
      }
      if (commandId.startsWith("delete-layout-")) {
        const layoutId = commandId.slice("delete-layout-".length);
        if (!libraryAppId) {
          return { kind: "handled" };
        }
        const snapshot = getNamedWorkbenchLayout(libraryAppId, layoutId);
        if (!snapshot) {
          return { kind: "handled" };
        }
        return {
          kind: "confirm-delete",
          layoutId,
          layoutName: snapshot.name,
        };
      }
      if (commandId === "layout-save-as") {
        return { kind: "open-save-dialog" };
      }
      if (commandId === "layout-manage") {
        return { kind: "open-manage-panel" };
      }
      if (commandId === "layout-export-current") {
        return { kind: "export-current" };
      }
      if (commandId === "layout-import") {
        return { kind: "trigger-import" };
      }
      switch (commandId) {
        case "layout-undo":
          undoLayoutChange();
          return { kind: "handled" };
        case "layout-redo":
          redoLayoutChange();
          return { kind: "handled" };
        case "layout-reset":
          resetLayout();
          return { kind: "handled" };
        case "layout-collapse-active":
          collapseActivePane();
          return { kind: "handled" };
        case "layout-expand-target":
          expandPaneTarget();
          return { kind: "handled" };
        case "layout-collapse-sides":
          collapseSidePanels();
          return { kind: "handled" };
        case "layout-expand-sides":
          expandSidePanels();
          return { kind: "handled" };
        case "layout-duplicate-pane":
          duplicateActivePane();
          return { kind: "handled" };
        case "layout-float-pane":
          floatActivePane?.();
          return { kind: "handled" };
        default:
          if (commandId.startsWith("open-")) {
            focusOrOpenPane(commandId.slice("open-".length));
          }
          return { kind: "handled" };
      }
    },
    [
      collapseActivePane,
      collapseSidePanels,
      duplicateActivePane,
      expandPaneTarget,
      expandSidePanels,
      focusOrOpenPane,
      libraryAppId,
      loadLayoutPreset,
      loadNamedLayout,
      redoLayoutChange,
      resetLayout,
      undoLayoutChange,
    ],
  );

  const workbenchProps = useMemo((): Pick<
    TRNWorkbenchProps,
    | "layout"
    | "onLayoutChange"
    | "activePaneId"
    | "collapsedRailFocusId"
    | "onPaneActivate"
    | "resolveDockSplitRatio"
    | "resolveEdgeDockRatio"
    | "onDockSplitApplied"
    | "onEdgeDockApplied"
    | "onSplitResized"
  > => ({
    layout,
    onLayoutChange: (next) => setLayout(next),
    activePaneId,
    collapsedRailFocusId,
    onPaneActivate: setActivePaneId,
    resolveDockSplitRatio: (incomingType, targetType, zone, fallback = 0.55) =>
      resolveDockSplitRatio(dockMemory, incomingType, targetType, zone, fallback),
    resolveEdgeDockRatio: (editorType, zone, fallback) =>
      resolveWorkbenchEdgeRatio(
        dockMemory,
        editorType,
        zone,
        fallback ?? WORKBENCH_EDGE_DOCK_RATIO[zone],
      ),
    onDockSplitApplied: (incomingType, targetType, zone, ratio) => {
      setDockMemory((memory) =>
        rememberDockSplitRatio(memory, incomingType, targetType, zone as PaneDockZone, ratio),
      );
    },
    onEdgeDockApplied: (editorType, zone, ratio) => {
      setDockMemory((memory) => rememberWorkbenchEdgeRatio(memory, editorType, zone, ratio));
    },
    onSplitResized: (firstType, secondType, direction, ratio) => {
      setDockMemory((memory) =>
        rememberSplitResizeRatio(memory, firstType, secondType, direction, ratio),
      );
    },
  }), [activePaneId, collapsedRailFocusId, dockMemory, layout, setLayout]);

  return {
    layout,
    setLayout,
    dockMemory,
    resetLayout,
    undoLayoutChange,
    redoLayoutChange,
    layoutCanUndo,
    layoutCanRedo,
    collapseActivePane,
    expandPaneTarget,
    cycleCollapsedRailFocus,
    focusOrOpenPane,
    duplicateActivePane,
    loadLayoutPreset,
    loadNamedLayout,
    deleteNamedLayout,
    bumpLibraryRevision,
    commandItems,
    runCommand,
    workbenchProps,
    activePaneId,
    libraryAppId,
    startupPreference,
    libraryRevision,
  };
}
