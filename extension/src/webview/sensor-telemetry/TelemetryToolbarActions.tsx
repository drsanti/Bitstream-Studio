import { FolderOpen, Microchip, PanelsTopLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useOpenAssetManager } from "../assets-manager/hooks/useOpenAssetManager.js";
import {
  STUDIO_TOOLBAR_DIVIDER_CLASS,
  StudioToolbarMenu,
} from "../sensor-studio/features/editor/components/studio-toolbar/StudioToolbarMenu";
import {
  TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS,
  TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS,
  toolbarHeaderDropdownMenuIcon,
} from "../ui/components/toolbar-header-dropdown-menu-ui";
import { TRNMenuSearchableRow } from "../ui/TRN/TRNMenuSearch.js";
import { TRNSearchableMenuShell } from "../ui/TRN/TRNSearchableMenuShell.js";
import { telemetryPaneMenuIcon } from "./telemetry-view-menu-ui";

export type TelemetryPaneCommand = {
  editorType: string;
  label: string;
};

export type TelemetryToolbarActionsProps = {
  layoutMenu?: ReactNode;
  onOpenDeviceSensorSettings?: () => void;
  onFocusPane?: (editorType: string) => void;
  paneCommands?: readonly TelemetryPaneCommand[];
};

/** Devices, Assets, View (panes), and layout menu for Sensor Telemetry chrome. */
export function TelemetryToolbarActions(props: TelemetryToolbarActionsProps) {
  const {
    layoutMenu,
    onOpenDeviceSensorSettings,
    onFocusPane,
    paneCommands = [],
  } = props;
  const { openAssetManager } = useOpenAssetManager();

  return (
    <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-1.5">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded border border-amber-700/50 bg-amber-950/25 px-2 py-1 text-[11px] text-amber-100/90 hover:bg-amber-900/20"
        onClick={() => {
          onOpenDeviceSensorSettings?.();
        }}
      >
        <Microchip className="size-3 shrink-0 opacity-90" aria-hidden />
        Devices
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded border border-cyan-900/50 bg-cyan-950/20 px-2 py-1 text-[11px] text-cyan-100/90 hover:bg-cyan-950/35"
        onClick={() => {
          openAssetManager({ globalDirectoriesTab: "overview" });
        }}
      >
        <FolderOpen className="size-3 shrink-0 opacity-90" aria-hidden />
        Assets
      </button>

      <div className={STUDIO_TOOLBAR_DIVIDER_CLASS} aria-hidden />

      <StudioToolbarMenu
        label="View"
        align="right"
        prefixIcon={toolbarHeaderDropdownMenuIcon(PanelsTopLeft)}
        hint="Show or expand a telemetry workbench pane (config, 3D, deck, activity)"
      >
        <TRNSearchableMenuShell
          itemCount={paneCommands.length}
          panelClassName={TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS}
          maxHeightClassName="max-h-80"
        >
          <div className="flex flex-col gap-0.5">
            {paneCommands.map((pane) => (
              <TRNMenuSearchableRow
                key={pane.editorType}
                searchLabel={pane.label}
                searchKeywords={["pane", "view", "telemetry"]}
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
          </div>
        </TRNSearchableMenuShell>
      </StudioToolbarMenu>

      {layoutMenu}
    </div>
  );
}
