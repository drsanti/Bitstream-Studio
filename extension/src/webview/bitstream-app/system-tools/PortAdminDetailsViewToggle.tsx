import { Braces, List } from "lucide-react";
import type { PortDetailsViewMode } from "../../serialport/port-admin.store";

export type PortAdminDetailsViewToggleProps = {
  viewMode: PortDetailsViewMode;
  onViewModeChange: (mode: PortDetailsViewMode) => void;
};

const TOGGLE_BTN =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const TOGGLE_SELECTED =
  "border border-cyan-600/55 bg-cyan-950/45 text-cyan-100";
const TOGGLE_IDLE =
  "border border-transparent text-zinc-400 hover:bg-zinc-800/65 hover:text-zinc-100";

/** Icon toggle for Port details readable vs JSON view (section header). */
export function PortAdminDetailsViewToggle(props: PortAdminDetailsViewToggleProps)
{
  const { viewMode, onViewModeChange } = props;

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        role="radio"
        aria-checked={viewMode === "readable"}
        aria-label="Readable view"
        title="Readable"
        className={
          TOGGLE_BTN +
          " border border-zinc-600/75 bg-zinc-900/55 " +
          (viewMode === "readable" ? TOGGLE_SELECTED : TOGGLE_IDLE)
        }
        onClick={() => onViewModeChange("readable")}
      >
        <List className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={viewMode === "json"}
        aria-label="JSON view"
        title="JSON"
        className={
          TOGGLE_BTN +
          " border border-zinc-600/75 bg-zinc-900/55 " +
          (viewMode === "json" ? TOGGLE_SELECTED : TOGGLE_IDLE)
        }
        onClick={() => onViewModeChange("json")}
      >
        <Braces className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
}
