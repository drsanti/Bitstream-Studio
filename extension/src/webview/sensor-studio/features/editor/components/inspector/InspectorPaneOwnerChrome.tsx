import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS } from "../../../../../bitstream-shell/ui/workspace-chrome-chip";
import type { InspectorPaneRole } from "./InspectorDualPaneShell";

const INSPECTOR_OWNER_ROLE_CHIP_FRAME_CLASS =
  "inline-flex h-[21px] shrink-0 items-center justify-center rounded-full border px-2 py-1 select-none";

const INSPECTOR_OWNER_ACTIVE_CHIP_CLASS = `${INSPECTOR_OWNER_ROLE_CHIP_FRAME_CLASS} w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] border-emerald-500/35 bg-emerald-500/10 text-zinc-200/95 ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS}`;

const INSPECTOR_OWNER_PINNED_CHIP_CLASS = `${INSPECTOR_OWNER_ROLE_CHIP_FRAME_CLASS} w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] border-amber-500/35 bg-amber-500/10 text-zinc-200/95 ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS}`;

export type InspectorPaneOwnerChromeProps = {
  role: InspectorPaneRole;
  /** Show Active / Pinned chip when two inspector panes are open. */
  showRoleBadge: boolean;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  pinToggle: ReactNode;
};

export function InspectorPaneOwnerChrome(props: InspectorPaneOwnerChromeProps) {
  const { role, showRoleBadge, label, icon: Icon, iconClassName, pinToggle } = props;
  const isPinned = role === "pinned";

  return (
    <div className="mb-1 flex min-w-0 shrink-0 items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        {showRoleBadge ? (
          <span className={isPinned ? INSPECTOR_OWNER_PINNED_CHIP_CLASS : INSPECTOR_OWNER_ACTIVE_CHIP_CLASS}>
            {isPinned ? "Pinned" : "Active"}
          </span>
        ) : null}
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClassName}`} aria-hidden />
        <span
          className={`min-w-0 truncate text-zinc-100 ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS}`}
        >
          {label}
        </span>
      </div>
      <div className="shrink-0">{pinToggle}</div>
    </div>
  );
}
