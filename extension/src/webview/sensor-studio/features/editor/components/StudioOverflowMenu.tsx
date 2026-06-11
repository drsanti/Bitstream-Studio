import { FolderOpen, Menu, Microchip } from "lucide-react";
import { useMemo } from "react";
import { useOpenAssetManager } from "../../../../assets-manager/hooks/useOpenAssetManager.js";
import { ToolbarDropdownMenu } from "../../../../ui/components/ToolbarDropdownMenu";
import {
  TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS,
  TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS,
  toolbarHeaderDropdownMenuIcon,
} from "../../../../ui/components/toolbar-header-dropdown-menu-ui";
import { WORKSPACE_CHROME_TOOLBAR_BTN_CLASS } from "../../../../ui/components/workspace-chrome-toolbar-ui";
import { TRNMenuItemButton, type TRNMenuItemButtonProps } from "../../../../ui/TRN/TRNMenu";
import { TRNSearchableMenuShell } from "../../../../ui/TRN/TRNSearchableMenuShell.js";
import { TRNMenuFilterableSection, useTRNMenuItemMatches } from "../../../../ui/TRN/TRNMenuSearch.js";
import {
  WorkbenchLayoutMenuSections,
  type WorkbenchLayoutMenuProps,
} from "../../../../ui/workbench/WorkbenchLayoutMenu";
import { STUDIO_TOOLBAR_MENU_ICONS } from "./studio-toolbar/studio-toolbar-menu-ui";
import { useFlowEditorStore } from "../store/flow-editor.store";

export type StudioOverflowMenuProps = {
  /** Menu trigger styling (default: shell toolbar chip). */
  menuTriggerClassName?: string;
  onOpenDeviceSensorSettings?: () => void;
  onDuplicateSelection?: () => void;
  onDeleteSelection?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvasSelection?: () => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
  layoutMenuProps?: WorkbenchLayoutMenuProps | null;
};

function StudioMenuRow(
  props: TRNMenuItemButtonProps & { searchLabel: string; searchKeywords?: readonly string[] },
) {
  const { searchLabel, searchKeywords, ...buttonProps } = props;
  const visible = useTRNMenuItemMatches(searchLabel, searchKeywords);
  if (!visible) {
    return null;
  }
  return (
    <TRNMenuItemButton
      role="menuitem"
      tone="glass-dropdown"
      className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
      {...buttonProps}
    />
  );
}

/** Studio workspace actions — shell toolbar overflow (devices, flow, layout). */
export function StudioOverflowMenu(props: StudioOverflowMenuProps) {
  const {
    menuTriggerClassName,
    onOpenDeviceSensorSettings,
    onDuplicateSelection,
    onDeleteSelection,
    onSelectAllNodes,
    onClearCanvasSelection,
    onExportFlow,
    onImportFlowPick,
    layoutMenuProps,
  } = props;
  const { openAssetManager } = useOpenAssetManager();
  const openSaveToLibraryDialog = useFlowEditorStore((s) => s.openSaveToLibraryDialog);

  const menuItemCount = useMemo(() => {
    let count = 9;
    if (layoutMenuProps != null) {
      count += layoutMenuProps.presets.length + layoutMenuProps.namedLayouts.length + 6;
    }
    return count;
  }, [layoutMenuProps]);

  return (
    <div className="relative shrink-0">
      <ToolbarDropdownMenu
        label="Studio"
        hint="Devices, assets, flow graph, and workbench layout"
        align="right"
        iconOnly
        prefixIcon={<Menu className="size-3.5 shrink-0 opacity-90" aria-hidden />}
        buttonClassName={
          menuTriggerClassName ?? `${WORKSPACE_CHROME_TOOLBAR_BTN_CLASS} !px-1.5`
        }
      >
        <TRNSearchableMenuShell
          itemCount={menuItemCount}
          panelClassName={TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS}
          maxHeightClassName="max-h-80"
        >
          <div className="flex flex-col gap-0.5" role="menu">
            <TRNMenuFilterableSection
              title="Workspace"
              itemLabels={["Devices", "Assets"]}
              spacing="menuFirst"
            >
              <StudioMenuRow
                searchLabel="Devices"
                searchKeywords={["sensors", "settings"]}
                icon={toolbarHeaderDropdownMenuIcon(Microchip)}
                label="Devices"
                onClick={() => {
                  onOpenDeviceSensorSettings?.();
                }}
              />
              <StudioMenuRow
                searchLabel="Assets"
                searchKeywords={["models", "files"]}
                icon={toolbarHeaderDropdownMenuIcon(FolderOpen)}
                label="Assets"
                onClick={() => {
                  openAssetManager({ globalDirectoriesTab: "overview" });
                }}
              />
            </TRNMenuFilterableSection>

            <TRNMenuFilterableSection
              title="Flow graph"
              itemLabels={["Duplicate", "Delete", "Select all", "Clear selection"]}
              spacing="menuNext"
            >
              <StudioMenuRow
                searchLabel="Duplicate"
                icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.duplicate)}
                label="Duplicate"
                onClick={() => {
                  onDuplicateSelection?.();
                }}
              />
              <StudioMenuRow
                searchLabel="Delete"
                icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.delete)}
                label="Delete"
                onClick={() => {
                  onDeleteSelection?.();
                }}
              />
              <StudioMenuRow
                searchLabel="Select all"
                icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.selectAll)}
                label="Select all"
                onClick={() => {
                  onSelectAllNodes?.();
                }}
              />
              <StudioMenuRow
                searchLabel="Clear selection"
                icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.clearSelection)}
                label="Clear selection"
                onClick={() => {
                  onClearCanvasSelection?.();
                }}
              />
            </TRNMenuFilterableSection>

            <TRNMenuFilterableSection
              title="Flow file"
              itemLabels={["Save to library", "Export flow JSON", "Import flow JSON"]}
              spacing="menuNext"
            >
              <StudioMenuRow
                searchLabel="Save to library"
                icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.saveToLibrary)}
                label="Save to library"
                onClick={() => openSaveToLibraryDialog()}
              />
              <StudioMenuRow
                searchLabel="Export flow JSON"
                searchKeywords={["export", "json"]}
                icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.exportFlow)}
                label="Export flow JSON"
                onClick={onExportFlow}
              />
              <StudioMenuRow
                searchLabel="Import flow JSON"
                searchKeywords={["import", "json"]}
                icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.importFlow)}
                label="Import flow JSON"
                onClick={onImportFlowPick}
              />
            </TRNMenuFilterableSection>

            {layoutMenuProps != null ? (
              <>
                <div className="px-2 py-1.5 text-[10px] leading-snug text-zinc-500">
                  Tip: save your desk via <span className="text-zinc-400">Layout → Save current layout as…</span>
                </div>
                <WorkbenchLayoutMenuSections {...layoutMenuProps} />
              </>
            ) : null}
          </div>
        </TRNSearchableMenuShell>
      </ToolbarDropdownMenu>
    </div>
  );
}
