import { FolderOpen, Menu, Microchip } from "lucide-react";
import { useOpenAssetManager } from "../../../../assets-manager/hooks/useOpenAssetManager.js";
import { ToolbarDropdownMenu } from "../../../../ui/components/ToolbarDropdownMenu";
import {
  TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS,
  TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS,
  toolbarHeaderDropdownMenuIcon,
} from "../../../../ui/components/toolbar-header-dropdown-menu-ui";
import { WORKSPACE_CHROME_TOOLBAR_BTN_CLASS } from "../../../../ui/components/workspace-chrome-toolbar-ui";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../../../../ui/TRN/TRNMenu";
import {
  WorkbenchLayoutMenuSections,
  type WorkbenchLayoutMenuProps,
} from "../../../../ui/workbench/WorkbenchLayoutMenu";
import { STUDIO_TOOLBAR_MENU_ICONS } from "./studio-toolbar/studio-toolbar-menu-ui";

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
        <TRNMenuPanel
          tone="glass-dropdown"
          edgeAutoScroll
          className={TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS}
        >
          <div className="flex flex-col gap-0.5" role="menu">
            <TRNMenuSectionTitle spacing="menuFirst">Workspace</TRNMenuSectionTitle>
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={toolbarHeaderDropdownMenuIcon(Microchip)}
              label="Devices"
              onClick={() => {
                onOpenDeviceSensorSettings?.();
              }}
            />
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={toolbarHeaderDropdownMenuIcon(FolderOpen)}
              label="Assets"
              onClick={() => {
                openAssetManager({ globalDirectoriesTab: "overview" });
              }}
            />

            <TRNMenuSectionTitle spacing="menuNext">Flow graph</TRNMenuSectionTitle>
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.duplicate)}
              label="Duplicate"
              onClick={() => {
                onDuplicateSelection?.();
              }}
            />
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.delete)}
              label="Delete"
              onClick={() => {
                onDeleteSelection?.();
              }}
            />
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.selectAll)}
              label="Select all"
              onClick={() => {
                onSelectAllNodes?.();
              }}
            />
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.clearSelection)}
              label="Clear selection"
              onClick={() => {
                onClearCanvasSelection?.();
              }}
            />

            <TRNMenuSectionTitle spacing="menuNext">Flow file</TRNMenuSectionTitle>
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.exportFlow)}
              label="Export flow JSON"
              onClick={onExportFlow}
            />
            <TRNMenuItemButton
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={toolbarHeaderDropdownMenuIcon(STUDIO_TOOLBAR_MENU_ICONS.importFlow)}
              label="Import flow JSON"
              onClick={onImportFlowPick}
            />

            {layoutMenuProps != null ? (
              <WorkbenchLayoutMenuSections {...layoutMenuProps} />
            ) : null}
          </div>
        </TRNMenuPanel>
      </ToolbarDropdownMenu>
    </div>
  );
}
