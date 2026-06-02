import { RefreshCw } from "lucide-react";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { TRN_HINT_HOVER_DELAY_MS, TRN_HINT_POPOVER_PANEL_CLASS } from "../ui/TRN/TRNHintText.js";
import { TRNTooltip } from "../ui/TRN/TRNTooltip.js";

const C = ternionFreeAssetPackCopy.checklist;

export function StartupChecklistRecheckButton(props: {
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (props.disabled || props.busy) {
      return;
    }
    props.onClick();
  };

  const button = (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={props.disabled || props.busy}
      aria-label={C.setupRecheckAriaLabel}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-500/30 bg-sky-500/15 text-sky-200/95 transition-colors hover:border-sky-400/40 hover:bg-sky-500/25 hover:text-sky-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCw
        className={`h-4 w-4 ${props.busy ? "animate-spin" : ""}`}
        strokeWidth={2.25}
        aria-hidden
      />
    </button>
  );

  return (
    <TRNTooltip
      trigger={button}
      triggerWrapper="span"
      triggerAriaLabel={C.setupRecheckAriaLabel}
      content={
        <div className="whitespace-pre-wrap text-left text-[11px] leading-relaxed text-zinc-100">
          {C.setupRecheckHint}
        </div>
      }
      panelClassName={TRN_HINT_POPOVER_PANEL_CLASS}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      placement="bottom-end"
      disableHoverFx
    />
  );
}
