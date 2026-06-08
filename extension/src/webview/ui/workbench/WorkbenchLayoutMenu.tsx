import { LayoutTemplate } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { ToolbarDropdownMenu } from "../components/ToolbarDropdownMenu";
import {
  TRNMenuItemButton,
} from "../TRN/TRNMenu.js";
import {
  TRNMenuFilterableSection,
  useOptionalTRNMenuSearchContext,
  useTRNMenuItemMatches,
} from "../TRN/TRNMenuSearch.js";
import { TRNSearchableMenuShell } from "../TRN/TRNSearchableMenuShell.js";
import type { WorkbenchLayoutMenuProps } from "./workbench-layout-menu.types";
import { TRN_GLASS_DROPDOWN_TEXT_CLASS } from "../components/toolbar-header-dropdown-menu-ui.js";
import {
  WORKBENCH_LAYOUT_MENU_ICONS,
  WORKBENCH_LAYOUT_MENU_ITEM_CLASS,
  WORKBENCH_LAYOUT_MENU_PANEL_CLASS,
  workbenchLayoutMenuIcon,
  workbenchLayoutPresetIcon,
} from "./workbench-layout-menu-ui";

export function WorkbenchLayoutMenuSections(props: WorkbenchLayoutMenuProps) {
  const {
    presets,
    namedLayouts,
    onLoadPreset,
    onLoadNamed,
    onSaveAs,
    onManage,
    onExportCurrent,
    onImport,
    onReset,
  } = props;

  const search = useOptionalTRNMenuSearchContext();
  const itemMatches = search?.itemMatches ?? (() => true);
  const visiblePresets = presets.filter((preset) => itemMatches(preset.label, ["layout", "preset"]));
  const visibleNamedLayouts = namedLayouts.filter((row) =>
    itemMatches(row.name, ["layout", "saved"]),
  );

  const layoutLibraryLabels = [
    "Save current layout as",
    "Manage layouts",
    "Export current layout",
    "Import layout",
  ] as const;
  const resetLabels = ["Reset to factory default"] as const;

  return (
    <>
      {visiblePresets.length > 0 ? (
        <TRNMenuFilterableSection
          title="Presets"
          itemLabels={visiblePresets.map((preset) => preset.label)}
          spacing="menuNext"
        >
          {visiblePresets.map((preset) => (
            <TRNMenuItemButton
              key={preset.id}
              role="menuitem"
              tone="glass-dropdown"
              className={WORKBENCH_LAYOUT_MENU_ITEM_CLASS}
              icon={workbenchLayoutPresetIcon(preset.id)}
              label={preset.label}
              onClick={() => {
                onLoadPreset(preset.id);
              }}
            />
          ))}
        </TRNMenuFilterableSection>
      ) : null}
      {visibleNamedLayouts.length > 0 ? (
        <TRNMenuFilterableSection
          title="My layouts"
          itemLabels={visibleNamedLayouts.map((row) => row.name)}
          spacing="menuNext"
        >
          {visibleNamedLayouts.map((row) => (
            <TRNMenuItemButton
              key={row.id}
              role="menuitem"
              tone="glass-dropdown"
              className={WORKBENCH_LAYOUT_MENU_ITEM_CLASS}
              icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.namedLayout)}
              label={row.name}
              onClick={() => {
                onLoadNamed(row.id);
              }}
            />
          ))}
        </TRNMenuFilterableSection>
      ) : null}
      <TRNMenuFilterableSection
        title="Layout library"
        itemLabels={layoutLibraryLabels}
        spacing="menuNext"
      >
        <WorkbenchLayoutMenuAction
          label="Save current layout as"
          keywords={["layout", "save"]}
          icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.saveAs)}
          onClick={onSaveAs}
        />
        <WorkbenchLayoutMenuAction
          label="Manage layouts"
          keywords={["layout", "library"]}
          icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.manage)}
          onClick={onManage}
        />
        <WorkbenchLayoutMenuAction
          label="Export current layout"
          keywords={["layout", "export"]}
          icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.exportCurrent)}
          onClick={onExportCurrent}
        />
        <WorkbenchLayoutMenuAction
          label="Import layout"
          keywords={["layout", "import"]}
          icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.importLayout)}
          onClick={onImport}
        />
      </TRNMenuFilterableSection>
      <TRNMenuFilterableSection title="Reset" itemLabels={resetLabels} spacing="menuNext">
        <WorkbenchLayoutMenuAction
          label="Reset to factory default"
          keywords={["layout", "factory"]}
          icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.reset)}
          onClick={onReset}
        />
      </TRNMenuFilterableSection>
    </>
  );
}

function WorkbenchLayoutMenuAction(props: {
  label: string;
  keywords?: readonly string[];
  icon: ReactNode;
  onClick: () => void;
}) {
  const visible = useTRNMenuItemMatches(props.label, props.keywords);
  if (!visible) {
    return null;
  }
  return (
    <TRNMenuItemButton
      role="menuitem"
      tone="glass-dropdown"
      className={WORKBENCH_LAYOUT_MENU_ITEM_CLASS}
      icon={props.icon}
      label={props.label}
      onClick={props.onClick}
    />
  );
}

export function WorkbenchLayoutMenu(props: WorkbenchLayoutMenuProps) {
  const menuItemCount = useMemo(
    () => props.presets.length + props.namedLayouts.length + 5,
    [props.namedLayouts.length, props.presets.length],
  );

  return (
    <div className="relative shrink-0">
      <ToolbarDropdownMenu
        label="Layout"
        hint="Presets, saved layouts, export and import."
        align="right"
        prefixIcon={<LayoutTemplate className="size-3 shrink-0 opacity-90" aria-hidden />}
        buttonClassName={`inline-flex items-center gap-1 rounded border border-sky-800/60 bg-sky-950/30 px-2 py-1 text-sky-100/90 hover:bg-sky-900/25 ${TRN_GLASS_DROPDOWN_TEXT_CLASS}`}
      >
        <TRNSearchableMenuShell
          itemCount={menuItemCount}
          panelClassName={WORKBENCH_LAYOUT_MENU_PANEL_CLASS}
          maxHeightClassName="max-h-80"
        >
          <div className="flex flex-col gap-0.5" role="menu">
            <WorkbenchLayoutMenuSections {...props} />
          </div>
        </TRNSearchableMenuShell>
      </ToolbarDropdownMenu>
    </div>
  );
}
