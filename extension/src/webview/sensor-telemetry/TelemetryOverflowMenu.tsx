import { FolderOpen, Menu, Microchip } from "lucide-react";
import { useOpenAssetManager } from "../assets-manager/hooks/useOpenAssetManager.js";
import { ToolbarDropdownMenu } from "../ui/components/ToolbarDropdownMenu";
import {
  TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS,
  TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS,
  toolbarHeaderDropdownMenuIcon,
} from "../ui/components/toolbar-header-dropdown-menu-ui";
import { WORKSPACE_CHROME_TOOLBAR_BTN_CLASS } from "../ui/components/workspace-chrome-toolbar-ui";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../ui/TRN/TRNMenu";
import {
  WorkbenchLayoutMenuSections,
  type WorkbenchLayoutMenuProps,
} from "../ui/workbench/WorkbenchLayoutMenu";
import { telemetryPaneMenuIcon } from "./telemetry-view-menu-ui";
import type { TelemetryPaneCommand } from "./TelemetryToolbarActions";

export type TelemetryOverflowMenuProps = {
  layoutMenuProps?: WorkbenchLayoutMenuProps | null;
  onOpenDeviceSensorSettings?: () => void;
  onFocusPane?: (editorType: string) => void;
  paneCommands?: readonly TelemetryPaneCommand[];
  /** Omit Assets row when merged into shell header menu (Asset Manager lives there). */
  omitAssets?: boolean;
};

/** Telemetry workspace menu items (no trigger) — for shell header menu or overflow dropdown. */
export function TelemetryOverflowMenuSections(props: TelemetryOverflowMenuProps) {
  const {
    layoutMenuProps,
    onOpenDeviceSensorSettings,
    onFocusPane,
    paneCommands = [],
    omitAssets = false,
  } = props;
  const { openAssetManager } = useOpenAssetManager();

  return (
    <>
      <TRNMenuSectionTitle spacing="menuNext">Telemetry workspace</TRNMenuSectionTitle>
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
      {omitAssets ? null : (
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
      )}

      {paneCommands.length > 0 ? (
        <>
          <TRNMenuSectionTitle spacing="menuNext">View</TRNMenuSectionTitle>
          {paneCommands.map((pane) => (
            <TRNMenuItemButton
              key={pane.editorType}
              role="menuitem"
              tone="glass-dropdown"
              className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
              icon={telemetryPaneMenuIcon(pane.editorType)}
              label={pane.label}
              onClick={() => {
                onFocusPane?.(pane.editorType);
              }}
            />
          ))}
        </>
      ) : null}

      {layoutMenuProps != null ? (
        <WorkbenchLayoutMenuSections {...layoutMenuProps} />
      ) : null}
    </>
  );
}

/** @deprecated Prefer {@link TelemetryOverflowMenuSections} via shell header menu slot. */
export function TelemetryOverflowMenu(props: TelemetryOverflowMenuProps) {
  return (
    <div className="relative shrink-0">
      <ToolbarDropdownMenu
        label="Telemetry"
        hint="Devices, assets, workbench panes, and layout"
        align="right"
        iconOnly
        prefixIcon={<Menu className="size-3.5 shrink-0 opacity-90" aria-hidden />}
        buttonClassName={`${WORKSPACE_CHROME_TOOLBAR_BTN_CLASS} !px-1.5`}
      >
        <TRNMenuPanel
          tone="glass-dropdown"
          edgeAutoScroll
          className={TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS}
        >
          <div className="flex flex-col gap-0.5" role="menu">
            <TelemetryOverflowMenuSections {...props} />
          </div>
        </TRNMenuPanel>
      </ToolbarDropdownMenu>
    </div>
  );
}
