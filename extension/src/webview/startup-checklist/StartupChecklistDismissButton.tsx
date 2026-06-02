import { X } from "lucide-react";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { TRN_HINT_HOVER_DELAY_MS, TRN_HINT_POPOVER_PANEL_CLASS } from "../ui/TRN/TRNHintText.js";
import { TRNTooltip } from "../ui/TRN/TRNTooltip.js";

const C = ternionFreeAssetPackCopy.checklist;

export function StartupChecklistDismissButton(props: {
  onClick: () => void;
  /** Optional hint when closing early (walkthrough not finished). */
  hint?: string;
}) {
  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    props.onClick();
  };

  const button = (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={C.setupCloseAriaLabel}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-rose-500/30 bg-rose-500/15 text-rose-200/95 transition-colors hover:border-rose-400/40 hover:bg-rose-500/25 hover:text-rose-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-400/50"
    >
      <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
    </button>
  );

  if (props.hint == null || props.hint.length === 0) {
    return button;
  }

  return (
    <TRNTooltip
      trigger={button}
      triggerWrapper="span"
      triggerAriaLabel={C.setupCloseAriaLabel}
      content={
        <div className="whitespace-pre-wrap text-left text-[11px] leading-relaxed text-zinc-100">
          {props.hint}
        </div>
      }
      panelClassName={TRN_HINT_POPOVER_PANEL_CLASS}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      placement="bottom-end"
      disableHoverFx
    />
  );
}
