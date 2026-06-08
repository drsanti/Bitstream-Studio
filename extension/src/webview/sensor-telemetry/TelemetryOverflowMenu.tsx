import { FolderOpen, Menu, Microchip } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useOpenAssetManager } from "../assets-manager/hooks/useOpenAssetManager.js";
import { ToolbarDropdownMenu } from "../ui/components/ToolbarDropdownMenu";
import {
  TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS,
  TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS,
  toolbarHeaderDropdownMenuIcon,
} from "../ui/components/toolbar-header-dropdown-menu-ui";
import { WORKSPACE_CHROME_TOOLBAR_BTN_CLASS } from "../ui/components/workspace-chrome-toolbar-ui";
import {
  TRNMenuFilterableSection,
  useTRNMenuItemMatches,
} from "../ui/TRN/TRNMenuSearch.js";
import { TRNSearchableMenuShell } from "../ui/TRN/TRNSearchableMenuShell.js";
import { TRNMenuItemButton } from "../ui/TRN/TRNMenu";
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

  const devicesVisible = useTRNMenuItemMatches("Devices", ["telemetry", "sensors", "settings"]);
  const assetsVisible = useTRNMenuItemMatches("Assets", ["telemetry", "models"]);

  return (
    <>
      <TRNMenuFilterableSection
        title="Telemetry workspace"
        itemLabels={["Devices", ...(omitAssets ? [] : ["Assets"])]}
        spacing="menuNext"
      >
        {devicesVisible ? (
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
        ) : null}
        {omitAssets || !assetsVisible ? null : (
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
      </TRNMenuFilterableSection>

      {paneCommands.length > 0 ? (
        <TRNMenuFilterableSection
          title="View"
          itemLabels={paneCommands.map((pane) => pane.label)}
          spacing="menuNext"
        >
          {paneCommands.map((pane) => (
            <TelemetryPaneMenuRow
              key={pane.editorType}
              label={pane.label}
              icon={telemetryPaneMenuIcon(pane.editorType)}
              onSelect={() => {
                onFocusPane?.(pane.editorType);
              }}
            />
          ))}
        </TRNMenuFilterableSection>
      ) : null}

      {layoutMenuProps != null ? (
        <WorkbenchLayoutMenuSections {...layoutMenuProps} />
      ) : null}
    </>
  );
}

function TelemetryPaneMenuRow(props: {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
}) {
  const visible = useTRNMenuItemMatches(props.label, ["pane", "view", "telemetry"]);
  if (!visible) {
    return null;
  }
  return (
    <TRNMenuItemButton
      role="menuitem"
      tone="glass-dropdown"
      className={TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS}
      icon={props.icon}
      label={props.label}
      onClick={props.onSelect}
    />
  );
}

/** @deprecated Prefer {@link TelemetryOverflowMenuSections} via shell header menu slot. */
export function TelemetryOverflowMenu(props: TelemetryOverflowMenuProps) {
  const { layoutMenuProps, paneCommands = [], omitAssets = false } = props;
  const menuItemCount = useMemo(() => {
    let count = omitAssets ? 1 : 2;
    count += paneCommands.length;
    if (layoutMenuProps != null) {
      count += layoutMenuProps.presets.length + layoutMenuProps.namedLayouts.length + 5;
    }
    return count;
  }, [layoutMenuProps, omitAssets, paneCommands.length]);

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
        <TRNSearchableMenuShell
          itemCount={menuItemCount}
          panelClassName={TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS}
          maxHeightClassName="max-h-80"
        >
          <div className="flex flex-col gap-0.5" role="menu">
            <TelemetryOverflowMenuSections {...props} />
          </div>
        </TRNSearchableMenuShell>
      </ToolbarDropdownMenu>
    </div>
  );
}
