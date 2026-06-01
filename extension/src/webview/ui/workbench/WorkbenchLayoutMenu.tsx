import { LayoutTemplate } from "lucide-react";
import { ToolbarDropdownMenu } from "../components/ToolbarDropdownMenu";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../TRN/TRNMenu.js";
import type { WorkbenchLayoutMenuProps } from "./workbench-layout-menu.types";
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

  return (
    <>
      {presets.length > 0 ? (
        <>
          <TRNMenuSectionTitle spacing="menuNext">Presets</TRNMenuSectionTitle>
          {presets.map((preset) => (
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
        </>
      ) : null}
      {namedLayouts.length > 0 ? (
        <>
          <TRNMenuSectionTitle spacing="menuNext">My layouts</TRNMenuSectionTitle>
          {namedLayouts.map((row) => (
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
        </>
      ) : null}
      <TRNMenuSectionTitle spacing="menuNext">Layout library</TRNMenuSectionTitle>
      <TRNMenuItemButton
        role="menuitem"
        tone="glass-dropdown"
        className={WORKBENCH_LAYOUT_MENU_ITEM_CLASS}
        icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.saveAs)}
        label="Save current layout as"
        onClick={onSaveAs}
      />
      <TRNMenuItemButton
        role="menuitem"
        tone="glass-dropdown"
        className={WORKBENCH_LAYOUT_MENU_ITEM_CLASS}
        icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.manage)}
        label="Manage layouts"
        onClick={onManage}
      />
      <TRNMenuItemButton
        role="menuitem"
        tone="glass-dropdown"
        className={WORKBENCH_LAYOUT_MENU_ITEM_CLASS}
        icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.exportCurrent)}
        label="Export current layout"
        onClick={onExportCurrent}
      />
      <TRNMenuItemButton
        role="menuitem"
        tone="glass-dropdown"
        className={WORKBENCH_LAYOUT_MENU_ITEM_CLASS}
        icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.importLayout)}
        label="Import layout"
        onClick={onImport}
      />
      <TRNMenuSectionTitle spacing="menuNext">Reset</TRNMenuSectionTitle>
      <TRNMenuItemButton
        role="menuitem"
        tone="glass-dropdown"
        className={WORKBENCH_LAYOUT_MENU_ITEM_CLASS}
        icon={workbenchLayoutMenuIcon(WORKBENCH_LAYOUT_MENU_ICONS.reset)}
        label="Reset to factory default"
        onClick={onReset}
      />
    </>
  );
}

export function WorkbenchLayoutMenu(props: WorkbenchLayoutMenuProps) {
  return (
    <div className="relative shrink-0">
      <ToolbarDropdownMenu
        label="Layout"
        hint="Presets, saved layouts, export and import."
        align="right"
        prefixIcon={<LayoutTemplate className="size-3 shrink-0 opacity-90" aria-hidden />}
        buttonClassName="inline-flex items-center gap-1 rounded border border-sky-800/60 bg-sky-950/30 px-2 py-1 text-[11px] text-sky-100/90 hover:bg-sky-900/25"
      >
        <TRNMenuPanel
          tone="glass-dropdown"
          edgeAutoScroll
          className={WORKBENCH_LAYOUT_MENU_PANEL_CLASS}
        >
          <div className="flex flex-col gap-0.5" role="menu">
            <WorkbenchLayoutMenuSections {...props} />
          </div>
        </TRNMenuPanel>
      </ToolbarDropdownMenu>
    </div>
  );
}
