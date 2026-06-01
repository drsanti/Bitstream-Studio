import { FolderOpen, Microchip } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useBitstreamTransportActions } from "../../../../bitstream-app/context/bitstreamTransportActions.context";
import { BitstreamSensorSampleRxBadge } from "../../../../bitstream-shell/ui/BitstreamTelemetryRxBadges";
import { useOpenAssetManager } from "../../../../assets-manager/hooks/useOpenAssetManager.js";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../../../../ui/TRN/TRNMenu";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import {
  STUDIO_TOOLBAR_DIVIDER_CLASS,
  StudioToolbarMenu,
} from "./studio-toolbar/StudioToolbarMenu";
import { STUDIO_TOOLBAR_INSERT_SECTIONS } from "./studio-toolbar/studio-toolbar-insert-sections";

type StudioToolbarProps = {
  borderColor: string;
  entries: NodeCatalogEntry[];
  onAddNode: (entry: NodeCatalogEntry) => void;
  onOpenDeviceSensorSettings?: () => void;
  onDuplicateSelection?: () => void;
  onDeleteSelection?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvasSelection?: () => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
  layoutMenu?: ReactNode;
};

export function StudioToolbar(props: StudioToolbarProps) {
  const {
    borderColor,
    entries,
    onAddNode,
    onOpenDeviceSensorSettings,
    onDuplicateSelection,
    onDeleteSelection,
    onSelectAllNodes,
    onClearCanvasSelection,
    onExportFlow,
    onImportFlowPick,
    layoutMenu,
  } = props;
  const { openAssetManager } = useOpenAssetManager();
  const { reconnectTelemetry } = useBitstreamTransportActions();

  const entryById = useMemo(() => {
    const m = new Map<string, NodeCatalogEntry>();
    for (const entry of entries) {
      m.set(entry.id, entry);
    }
    return m;
  }, [entries]);

  const insertSections = useMemo(() => {
    return STUDIO_TOOLBAR_INSERT_SECTIONS.map((section) => ({
      title: section.title,
      entries: section.nodeIds
        .map((id) => entryById.get(id))
        .filter((entry): entry is NodeCatalogEntry => entry != null),
    })).filter((section) => section.entries.length > 0);
  }, [entryById]);

  return (
    <header
      className="relative flex min-h-[42px] flex-nowrap items-center gap-2 border-b px-3 py-2"
      style={{ borderColor }}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <div className="shrink-0 text-sm font-semibold text-zinc-100">Sensor Studio</div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center px-2">
        <BitstreamSensorSampleRxBadge
          variant="chip"
          chipMetric="aggregateFps"
          onReconnectTelemetry={reconnectTelemetry}
        />
      </div>

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

        {insertSections.length > 0 ? (
          <StudioToolbarMenu
            label="Insert"
            hint="Add a catalog node to the flow (also available in the Library pane)"
          >
            <TRNMenuPanel
              tone="glass-dropdown"
              className="min-w-48 py-1 scrollbar-hide max-h-80 overflow-y-auto"
            >
              <div className="flex flex-col gap-0.5">
                {insertSections.map((section, sectionIndex) => (
                  <div key={section.title}>
                    <TRNMenuSectionTitle spacing={sectionIndex === 0 ? "menuFirst" : "menuNext"}>
                      {section.title}
                    </TRNMenuSectionTitle>
                    {section.entries.map((entry) => (
                      <TRNMenuItemButton
                        key={entry.id}
                        role="menuitem"
                        tone="glass-dropdown"
                        label={entry.title}
                        onClick={() => {
                          onAddNode(entry);
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </TRNMenuPanel>
          </StudioToolbarMenu>
        ) : null}

        <StudioToolbarMenu label="Edit" hint="Selection and clipboard actions on the flow canvas">
          <TRNMenuPanel tone="glass-dropdown" className="min-w-44 py-1">
            <div className="flex flex-col gap-0.5">
              <TRNMenuItemButton
                role="menuitem"
                tone="glass-dropdown"
                label="Duplicate"
                onClick={() => {
                  onDuplicateSelection?.();
                }}
              />
              <TRNMenuItemButton
                role="menuitem"
                tone="glass-dropdown"
                label="Delete"
                onClick={() => {
                  onDeleteSelection?.();
                }}
              />
              <TRNMenuSectionTitle spacing="menuNext">Selection</TRNMenuSectionTitle>
              <TRNMenuItemButton
                role="menuitem"
                tone="glass-dropdown"
                label="Select all"
                onClick={() => {
                  onSelectAllNodes?.();
                }}
              />
              <TRNMenuItemButton
                role="menuitem"
                tone="glass-dropdown"
                label="Clear selection"
                onClick={() => {
                  onClearCanvasSelection?.();
                }}
              />
            </div>
          </TRNMenuPanel>
        </StudioToolbarMenu>

        <StudioToolbarMenu label="File" hint="Export or import the flow graph JSON">
          <TRNMenuPanel tone="glass-dropdown" className="min-w-44 py-1">
            <div className="flex flex-col gap-0.5">
              <TRNMenuItemButton
                role="menuitem"
                tone="glass-dropdown"
                label="Export flow JSON…"
                onClick={onExportFlow}
              />
              <TRNMenuItemButton
                role="menuitem"
                tone="glass-dropdown"
                label="Import flow JSON…"
                onClick={onImportFlowPick}
              />
            </div>
          </TRNMenuPanel>
        </StudioToolbarMenu>

        {layoutMenu}
      </div>
    </header>
  );
}
