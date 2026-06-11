import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { TRNMessageDialog } from "../TRN/TRNMessageDialog.js";
import { TRNWorkbenchHost } from "./TRNWorkbenchHost";
import type { LayoutNode, WorkbenchRegistry } from "./types";
import type { WorkbenchLayoutPreset } from "./workbench-layout-library";
import {
  createWorkbenchLayoutSnapshotFromCurrent,
  downloadWorkbenchLayoutJson,
  getNamedWorkbenchLayout,
  importWorkbenchLayoutToLibrary,
  listNamedWorkbenchLayouts,
  parseWorkbenchLayoutImport,
} from "./workbench-layout-library";
import type { WorkbenchLayoutMenuProps } from "./workbench-layout-menu.types";
import { WorkbenchLayoutLibraryPanel } from "./WorkbenchLayoutLibraryPanel";
import { useManagedWorkbench, type WorkbenchPaneCommand } from "./use-managed-workbench";
import { findEditorNode } from "./utils";
import { useWorkbenchFloating } from "./useWorkbenchFloating";
import { WorkbenchCommandOverlay } from "./WorkbenchCommandOverlay";
import { WorkbenchSaveLayoutDialog } from "./WorkbenchSaveLayoutDialog";
import { useWorkbenchKeyboardShortcuts } from "./use-workbench-keyboard-shortcuts";
import type { WorkbenchLayoutSnapshotV1 } from "./workbench-layout-library";
import { installWorkbenchLayoutHostSync } from "./install-workbench-layout-host-sync";
import type { WorkbenchDockSizeMemory } from "./workbench-dock-size-memory";

export interface StandaloneWorkbenchProps {
  initialLayout: LayoutNode;
  registry: WorkbenchRegistry;
  persistenceKey?: string;
  /** When false, session layout/dock memory are not written to localStorage. Default true. */
  persistLayout?: boolean;
  /** When true, startup ignores saved session layout (uses `initialLayout`). Default false. */
  ignorePersistedLayout?: boolean;
  enableFloating?: boolean;
  enableCommandPalette?: boolean;
  onDetachRejected?: () => void;
  validateLayout?: (raw: unknown) => LayoutNode;
  className?: string;
  sidePanelEditorTypes?: readonly string[];
  paneCommands?: readonly WorkbenchPaneCommand[];
  layoutPresets?: readonly WorkbenchLayoutPreset[];
  /** Optional Alt+P / Alt+I pane toggles (Sensor Studio). */
  togglePaneByEditorType?: (layout: LayoutNode, editorType: string) => LayoutNode;
  /** Fired when layout menu props change (toolbar slot). */
  onLayoutMenuPropsChange?: (props: WorkbenchLayoutMenuProps | null) => void;
  /** Fired when the user focuses a workbench pane (editor type from layout registry). */
  onActiveEditorTypeChange?: (editorType: string | null) => void;
  /** Fired when docked layout changes (collapse, split, tab switch, preset). */
  onWorkbenchLayoutChange?: (layout: LayoutNode) => void;
  /** Fired when layout or dock-size memory changes (split ratios, collapsed rails). */
  onWorkbenchSessionChange?: (snapshot: {
    layout: LayoutNode;
    dockMemory: WorkbenchDockSizeMemory;
  }) => void;
}

export type StandaloneWorkbenchHandle = {
  resetLayout: () => void;
  setLayout: Dispatch<SetStateAction<LayoutNode>>;
  getLayout: () => LayoutNode;
  undoLayout: () => void;
  redoLayout: () => void;
  openCommandPalette: () => void;
  /** Expand or split-open a pane by editor type (same as command palette pane items). */
  focusPane: (editorType: string) => void;
  exportLayoutSnapshot: (name?: string) => WorkbenchLayoutSnapshotV1 | null;
  applyImportedLayoutSnapshot: (
    snapshot: Pick<WorkbenchLayoutSnapshotV1, "layout" | "dockMemory">,
    focusEditorType?: string,
  ) => void;
};

export const StandaloneWorkbench = memo(
  forwardRef<StandaloneWorkbenchHandle, StandaloneWorkbenchProps>(function StandaloneWorkbench(
    {
      initialLayout,
      registry,
      persistenceKey,
      persistLayout = true,
      ignorePersistedLayout = false,
      enableFloating = true,
      enableCommandPalette = true,
      onDetachRejected,
      validateLayout,
      className = "ternion-workbench flex min-h-0 min-w-0 flex-1 flex-col",
      sidePanelEditorTypes = [],
      paneCommands = [],
      layoutPresets = [],
      togglePaneByEditorType,
      onLayoutMenuPropsChange,
      onActiveEditorTypeChange,
      onWorkbenchLayoutChange,
      onWorkbenchSessionChange,
    },
    ref,
  ) {
    const clearFloatingRef = useRef<() => void>(() => {});
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const managed = useManagedWorkbench({
      initialLayout,
      persistenceKey,
      persistLayout,
      ignorePersistedLayout,
      validateLayout,
      sidePanelEditorTypes,
      paneCommands,
      layoutPresets,
      onClearFloatingPanes: () => clearFloatingRef.current(),
    });

    const floating = useWorkbenchFloating({
      layout: managed.layout,
      onLayoutChange: managed.setLayout,
      enabled: enableFloating,
      onDetachRejected,
    });
    clearFloatingRef.current = floating.clearAllFloatingPanes;

    useEffect(() => {
      if (persistenceKey == null) {
        return;
      }
      return installWorkbenchLayoutHostSync(persistenceKey);
    }, [persistenceKey]);

    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [managePanelOpen, setManagePanelOpen] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<{
      layoutId: string;
      layoutName: string;
    } | null>(null);

    const floatActivePane = useCallback(() => {
      if (!managed.activePaneId) {
        return;
      }
      floating.detachPaneToFloat(
        managed.activePaneId,
        window.innerWidth * 0.5,
        window.innerHeight * 0.35,
      );
    }, [floating, managed.activePaneId]);

    const exportCurrentLayout = useCallback(() => {
      if (!persistenceKey) {
        return;
      }
      downloadWorkbenchLayoutJson(
        createWorkbenchLayoutSnapshotFromCurrent({
          appId: persistenceKey,
          name: "Current layout",
          layout: managed.layout,
          dockMemory: managed.dockMemory,
        }),
      );
    }, [managed.dockMemory, managed.layout, persistenceKey]);

    const exportNamedLayout = useCallback(
      (layoutId: string) => {
        if (!persistenceKey) {
          return;
        }
        const snapshot = getNamedWorkbenchLayout(persistenceKey, layoutId);
        if (snapshot) {
          downloadWorkbenchLayoutJson(snapshot);
        }
      },
      [persistenceKey],
    );

    const triggerImportLayout = useCallback(() => {
      setImportError(null);
      importInputRef.current?.click();
    }, []);

    const layoutMenuProps = useMemo((): WorkbenchLayoutMenuProps | null => {
      if (persistenceKey == null) {
        return null;
      }
      return {
        presets: layoutPresets,
        namedLayouts: listNamedWorkbenchLayouts(persistenceKey),
        startupPreference: managed.startupPreference,
        onLoadPreset: managed.loadLayoutPreset,
        onLoadNamed: managed.loadNamedLayout,
        onSaveAs: () => setSaveDialogOpen(true),
        onManage: () => setManagePanelOpen(true),
        onExportCurrent: exportCurrentLayout,
        onImport: triggerImportLayout,
        onReset: managed.resetLayout,
      };
    }, [
      exportCurrentLayout,
      layoutPresets,
      managed.libraryRevision,
      managed.loadLayoutPreset,
      managed.loadNamedLayout,
      managed.resetLayout,
      managed.startupPreference,
      persistenceKey,
      triggerImportLayout,
    ]);

    const onLayoutMenuPropsChangeRef = useRef(onLayoutMenuPropsChange);
    useEffect(() => {
      onLayoutMenuPropsChangeRef.current = onLayoutMenuPropsChange;
    }, [onLayoutMenuPropsChange]);

    const layoutMenuSignature = useMemo(() => {
      if (layoutMenuProps == null) {
        return "null";
      }
      const presetSig = layoutMenuProps.presets.map((p) => p.id).join("|");
      const namedSig = layoutMenuProps.namedLayouts
        .map((l) => `${l.id}:${l.updatedAt ?? ""}`)
        .join("|");
      return `${layoutMenuProps.startupPreference}__${presetSig}__${namedSig}`;
    }, [layoutMenuProps]);

    const lastLayoutMenuSignatureRef = useRef<string | null>(null);
    useEffect(() => {
      if (lastLayoutMenuSignatureRef.current === layoutMenuSignature) {
        return;
      }
      lastLayoutMenuSignatureRef.current = layoutMenuSignature;
      onLayoutMenuPropsChangeRef.current?.(layoutMenuProps);
    }, [layoutMenuProps, layoutMenuSignature]);

    const commandItems = useMemo(() => {
      const items = [...managed.commandItems];
      if (enableFloating) {
        const floatIndex = items.findIndex((row) => row.id === "layout-duplicate-pane");
        if (floatIndex >= 0) {
          items.splice(floatIndex + 1, 0, {
            id: "layout-float-pane",
            group: "Layout",
            label: "Float active pane",
            keywords: "float detach window popup",
          });
        }
      }
      return items;
    }, [enableFloating, managed.commandItems]);

    const keyboardHandlers = useMemo(
      () => ({
        onOpenCommandPalette: () => setCommandPaletteOpen(true),
        collapseActivePane: managed.collapseActivePane,
        expandPaneTarget: managed.expandPaneTarget,
        cycleCollapsedRailFocus: managed.cycleCollapsedRailFocus,
        undoLayoutChange: managed.undoLayoutChange,
        redoLayoutChange: managed.redoLayoutChange,
        duplicateActivePane: managed.duplicateActivePane,
        togglePaneByEditorType:
          togglePaneByEditorType == null
            ? undefined
            : (editorType: string) => {
                managed.setLayout((prev) => togglePaneByEditorType(prev, editorType));
              },
      }),
      [managed, togglePaneByEditorType],
    );

    useWorkbenchKeyboardShortcuts(keyboardHandlers, enableCommandPalette);

    useImperativeHandle(
      ref,
      () => ({
        resetLayout: managed.resetLayout,
        setLayout: managed.setLayout,
        getLayout: () => managed.layout,
        undoLayout: managed.undoLayoutChange,
        redoLayout: managed.redoLayoutChange,
        openCommandPalette: () => setCommandPaletteOpen(true),
        focusPane: (editorType) => {
          managed.focusOrOpenPane(editorType);
        },
        exportLayoutSnapshot: (name = "Flow export") => {
          if (persistenceKey == null) {
            return null;
          }
          return createWorkbenchLayoutSnapshotFromCurrent({
            appId: persistenceKey,
            name,
            layout: managed.layout,
            dockMemory: managed.dockMemory,
          });
        },
        applyImportedLayoutSnapshot: (snapshot, focusEditorType) => {
          managed.applyLayoutSnapshot(
            snapshot.layout,
            snapshot.dockMemory ?? {},
            focusEditorType,
          );
        },
      }),
      [managed, persistenceKey],
    );

    const handleCommandSelect = useCallback(
      (commandId: string) => {
        const result = managed.runCommand(commandId, floatActivePane);
        if (result.kind === "open-save-dialog") {
          setSaveDialogOpen(true);
        } else if (result.kind === "open-manage-panel") {
          setManagePanelOpen(true);
        } else if (result.kind === "export-current") {
          exportCurrentLayout();
        } else if (result.kind === "trigger-import") {
          triggerImportLayout();
        } else if (result.kind === "confirm-delete") {
          setPendingDelete({
            layoutId: result.layoutId,
            layoutName: result.layoutName,
          });
        }
        setCommandPaletteOpen(false);
      },
      [exportCurrentLayout, floatActivePane, managed, triggerImportLayout],
    );

    const handleImportFile = useCallback(
      async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !persistenceKey) {
          return;
        }
        try {
          const raw = await file.text();
          const parsed = parseWorkbenchLayoutImport(raw, persistenceKey);
          if (!parsed.ok) {
            if (parsed.reason === "wrong_app") {
              setImportError("Import file belongs to a different workspace.");
            } else {
              setImportError("Could not read layout file.");
            }
            setManagePanelOpen(true);
            return;
          }
          const imported = importWorkbenchLayoutToLibrary({
            appId: persistenceKey,
            snapshot: {
              ...parsed.snapshot,
              source: "import",
            },
            allowOverwrite: false,
          });
          if (!imported.ok) {
            if (imported.reason === "name_conflict" && imported.existing) {
              const overwrite = importWorkbenchLayoutToLibrary({
                appId: persistenceKey,
                snapshot: { ...parsed.snapshot, source: "import" },
                allowOverwrite: true,
              });
              if (overwrite.ok) {
                managed.bumpLibraryRevision();
                managed.loadNamedLayout(overwrite.snapshot.id);
                setImportError(null);
                return;
              }
            }
            if (imported.reason === "library_full") {
              setImportError("Layout library is full. Delete a layout first.");
            } else {
              setImportError("Could not import layout.");
            }
            setManagePanelOpen(true);
            return;
          }
          managed.bumpLibraryRevision();
          managed.loadNamedLayout(imported.snapshot.id);
          setImportError(null);
        } catch {
          setImportError("Could not read layout file.");
          setManagePanelOpen(true);
        }
      },
      [managed, persistenceKey],
    );

    const workbenchHostProps = useMemo(() => {
      const base = managed.workbenchProps;
      if (onActiveEditorTypeChange == null) {
        return base;
      }
      return {
        ...base,
        onPaneActivate: (paneId: string) => {
          base.onPaneActivate(paneId);
          const editor = findEditorNode(managed.layout, paneId);
          onActiveEditorTypeChange(editor?.editorType ?? null);
        },
      };
    }, [managed.layout, managed.workbenchProps, onActiveEditorTypeChange]);

    useEffect(() => {
      onWorkbenchLayoutChange?.(managed.layout);
    }, [managed.layout, onWorkbenchLayoutChange]);

    useEffect(() => {
      onWorkbenchSessionChange?.({
        layout: managed.layout,
        dockMemory: managed.dockMemory,
      });
    }, [managed.dockMemory, managed.layout, onWorkbenchSessionChange]);

    return (
      <>
        <TRNWorkbenchHost
          ref={null}
          registry={registry}
          enableFloating={enableFloating}
          onDetachRejected={onDetachRejected}
          className={className}
          floatingBindings={floating}
          {...workbenchHostProps}
        />
        {enableCommandPalette ? (
          <WorkbenchCommandOverlay
            open={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            items={commandItems}
            onSelect={handleCommandSelect}
          />
        ) : null}
        {persistenceKey != null ? (
          <>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json,.trn-workbench-layout.json"
              className="hidden"
              onChange={handleImportFile}
            />
            <WorkbenchSaveLayoutDialog
              open={saveDialogOpen}
              onOpenChange={setSaveDialogOpen}
              appId={persistenceKey}
              layout={managed.layout}
              dockMemory={managed.dockMemory}
              onSaved={() => {
                managed.bumpLibraryRevision();
              }}
            />
            <WorkbenchLayoutLibraryPanel
              open={managePanelOpen}
              onOpenChange={setManagePanelOpen}
              appId={persistenceKey}
              presets={layoutPresets}
              revision={managed.libraryRevision}
              onRevisionChange={managed.bumpLibraryRevision}
              onLoadNamed={(layoutId) => {
                managed.loadNamedLayout(layoutId);
                setManagePanelOpen(false);
              }}
              onExportSnapshot={exportNamedLayout}
              onImportPick={triggerImportLayout}
              importError={importError}
            />
          </>
        ) : null}
        <TRNMessageDialog
          open={pendingDelete != null}
          onOpenChange={(open) => {
            if (!open) {
              setPendingDelete(null);
            }
          }}
          title="Delete saved layout?"
          variant="warning"
          primaryTone="danger"
          primaryAction={{
            label: "Delete",
            onClick: () => {
              if (pendingDelete) {
                managed.deleteNamedLayout(pendingDelete.layoutId);
              }
              setPendingDelete(null);
            },
          }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => setPendingDelete(null),
          }}
        >
          Remove <strong>{pendingDelete?.layoutName}</strong> from your layout library? This cannot
          be undone.
        </TRNMessageDialog>
      </>
    );
  }),
);

StandaloneWorkbench.displayName = "StandaloneWorkbench";
