import { Activity, Workflow, Presentation, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useBitstreamWorkspaceModeStore,
  type BitstreamWorkspaceId,
} from "../../bitstream-app/state/bitstreamWorkspaceMode.store";
import {
  SHELL_CONTROL_DECK_ZONE_CLASS,
  SHELL_DECK_PILL_ACTIVE_BASE_CLASS,
  SHELL_DECK_PILL_INACTIVE_CLASS,
  SHELL_DECK_PILL_LABEL_CLASS,
} from "./shell-control-deck-ui";
import {
  SHELL_DECK_PILL_HOVER,
  SHELL_DECK_PILL_INTERACTIVE_CLASS,
} from "./shell-deck-pill-hover";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip";

type WorkspaceTab = {
  id: BitstreamWorkspaceId;
  label: string;
  hint: string;
  Icon: LucideIcon;
  activeSurfaceClass: string;
  activeIconClass: string;
};

const WORKSPACE_HOVER_CLASS: Record<BitstreamWorkspaceId, string> = {
  "sensor-telemetry": SHELL_DECK_PILL_HOVER.workspaceTelemetry,
  "sensor-studio": SHELL_DECK_PILL_HOVER.workspaceStudio,
  presentation: SHELL_DECK_PILL_HOVER.workspacePresentation,
  "course-studio": SHELL_DECK_PILL_HOVER.workspaceCourseStudio,
};

const WORKSPACE_TABS: readonly WorkspaceTab[] = [
  {
    id: "sensor-telemetry",
    label: "Sensor Telemetry",
    hint: "Configuration, 3D orientation, live telemetry deck, and activity log.",
    Icon: Activity,
    activeSurfaceClass:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    activeIconClass: "text-emerald-300",
  },
  {
    id: "sensor-studio",
    label: "Sensor Studio",
    hint: "Flow graph editor — library, canvas, inspector, and device wiring.",
    Icon: Workflow,
    activeSurfaceClass:
      "border-violet-500/45 bg-violet-500/15 text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    activeIconClass: "text-violet-300",
  },
  {
    id: "course-studio",
    label: "Course Studio",
    hint: "Alive documents — grid pages, theory markdown, callouts, and live sensor bindings.",
    Icon: GraduationCap,
    activeSurfaceClass:
      "border-amber-500/45 bg-amber-500/15 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    activeIconClass: "text-amber-300",
  },
  {
    id: "presentation",
    label: "Presentation",
    hint: "Training slides (v1) — theory reader, demos, and labs using live Bitstream Studio data.",
    Icon: Presentation,
    activeSurfaceClass:
      "border-sky-500/45 bg-sky-500/15 text-sky-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    activeIconClass: "text-sky-300",
  },
];

/** Workspace segmented control — Sensor Telemetry (emerald) · Sensor Studio (violet). */
export function BitstreamWorkspaceSwitcher() {
  const workspace = useBitstreamWorkspaceModeStore((s) => s.workspace);
  const setWorkspace = useBitstreamWorkspaceModeStore((s) => s.setWorkspace);

  return (
    <div className={SHELL_CONTROL_DECK_ZONE_CLASS} role="group" aria-label="Workspace">
      {WORKSPACE_TABS.map((tab) => {
        const active = workspace === tab.id;
        const { Icon } = tab;
        const trigger = (
          <button
            type="button"
            aria-pressed={active}
            className={`${SHELL_DECK_PILL_INTERACTIVE_CLASS} ${WORKSPACE_HOVER_CLASS[tab.id]} ${
              active
                ? `${SHELL_DECK_PILL_ACTIVE_BASE_CLASS} ${tab.activeSurfaceClass}`
                : SHELL_DECK_PILL_INACTIVE_CLASS
            }`}
            onClick={() => setWorkspace(tab.id)}
          >
            <Icon
              className={`size-3.5 shrink-0 ${active ? tab.activeIconClass : "text-zinc-500 opacity-85"}`}
              strokeWidth={2.25}
              aria-hidden
            />
            <span className={SHELL_DECK_PILL_LABEL_CLASS}>{tab.label}</span>
          </button>
        );

        return (
          <TRNTooltip
            key={tab.id}
            content={tab.hint}
            placement="bottom-start"
            openDelayMs={TRN_HINT_HOVER_DELAY_MS}
            disableHoverFx
            triggerWrapper="span"
            triggerClassName="!p-0"
            triggerAriaLabel={tab.label}
            trigger={trigger}
          />
        );
      })}
    </div>
  );
}
