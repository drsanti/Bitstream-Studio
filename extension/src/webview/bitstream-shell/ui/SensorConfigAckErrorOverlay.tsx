import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TRNAlertOverlay } from "../../ui/TRN/TRNAlertOverlay.js";
import { TRNGlassButton } from "../../ui/TRN/TRNGlassButton.js";

export type SensorConfigAckErrorOverlayProps = {
  open: boolean;
  title: string;
  summary: ReactNode;
  detailsTitle?: string;
  details?: ReactNode;
  retryDisabled?: boolean;
  onRetry: () => void;
  onDismiss: () => void;
};

/**
 * Blocking overlay when {@link sensorConfigAck} is `error`: Retry reapplies the last patch /
 * BMI270 mode resync; Dismiss clears ACK to `idle`.
 */
export function SensorConfigAckErrorOverlay(props: SensorConfigAckErrorOverlayProps)
{
  const {
    open,
    title,
    summary,
    detailsTitle = "Details",
    details,
    retryDisabled = false,
    onRetry,
    onDismiss,
  } = props;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasDetails = details != null;
  const effectiveDetailsOpen = useMemo(
    () => (hasDetails ? detailsOpen : false),
    [detailsOpen, hasDetails],
  );

  return (
    <TRNAlertOverlay open={open} variant="error" zIndex={350} onRequestClose={onDismiss}>
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <h2 className="mb-1 text-[15px] font-semibold leading-snug text-zinc-50">{title}</h2>
          <div className="text-[13px] leading-relaxed text-zinc-300">{summary}</div>
        </div>
        {hasDetails ? (
          <div className="min-w-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[12px] font-semibold text-zinc-200/90 hover:text-zinc-100"
              onClick={() => setDetailsOpen((v) => !v)}
            >
              <span className="select-none">{detailsTitle}</span>
              <span className="select-none text-zinc-400">
                {effectiveDetailsOpen ? "▲" : "▼"}
              </span>
            </button>
            {effectiveDetailsOpen ? (
              <div className="mt-2 rounded-md border border-zinc-700/70 bg-black/30 p-2">
                <div className="text-[12px] leading-relaxed text-zinc-300">{details}</div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <TRNGlassButton type="button" tone="neutral" size="sm" onClick={onDismiss}>
            Dismiss
          </TRNGlassButton>
          <TRNGlassButton
            type="button"
            tone="accent"
            size="sm"
            disabled={retryDisabled}
            onClick={onRetry}
          >
            Retry
          </TRNGlassButton>
        </div>
      </div>
    </TRNAlertOverlay>
  );
}

