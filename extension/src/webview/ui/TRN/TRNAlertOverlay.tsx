import type { HTMLAttributes, ReactNode } from "react";
import { useEffect } from "react";
import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type TRNAlertOverlayVariant = "error" | "warning" | "info";

export type TRNAlertOverlayProps = HTMLAttributes<HTMLDivElement> & {
  open: boolean;
  variant?: TRNAlertOverlayVariant;
  /** Shown beside the default variant icon when set. */
  prefixIcon?: ReactNode;
  children: ReactNode;
  /** Stacking order above the app shell (default above typical TRN dialogs at 72). */
  zIndex?: number;
  /**
   * When set, Escape and backdrop click invoke this so alerts are not modal traps
   * (e.g. handshake failures where the rest of the UI should remain reachable).
   */
  onRequestClose?: () => void;
};

function defaultVariantIcon(variant: TRNAlertOverlayVariant): ReactNode {
  switch (variant) {
    case "info":
      return (
        <Info className="h-6 w-6 text-sky-400" strokeWidth={2.25} aria-hidden />
      );
    case "warning":
      return (
        <AlertTriangle
          className="h-6 w-6 text-amber-400"
          strokeWidth={2.25}
          aria-hidden
        />
      );
    case "error":
    default:
      return (
        <CircleAlert
          className="h-6 w-6 text-rose-400"
          strokeWidth={2.25}
          aria-hidden />
      );
  }
}

function variantPanelClass(variant: TRNAlertOverlayVariant): string {
  switch (variant) {
    case "info":
      return "border-sky-500/35 bg-zinc-950/92 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]";
    case "warning":
      return "border-amber-500/40 bg-zinc-950/92 shadow-[0_0_0_1px_rgba(245,158,11,0.12)]";
    case "error":
    default:
      return "border-rose-500/45 bg-zinc-950/94 shadow-[0_0_0_1px_rgba(244,63,94,0.14)]";
  }
}

function variantIconWrapClass(variant: TRNAlertOverlayVariant): string {
  switch (variant) {
    case "info":
      return "bg-sky-500/15";
    case "warning":
      return "bg-amber-500/15";
    case "error":
    default:
      return "bg-rose-500/15";
  }
}

/**
 * Centered alert overlay: backdrop + icon + body.
 * Without `onRequestClose`, there is no dismiss affordance (Escape/backdrop do nothing).
 * With `onRequestClose`, Escape and backdrop click invoke it so alerts are not modal traps.
 */
export function TRNAlertOverlay(props: TRNAlertOverlayProps) {
  const {
    open,
    variant = "error",
    prefixIcon,
    children,
    zIndex = 85,
    className,
    onRequestClose,
    ...rest
  } = props;

  useEffect(() => {
    if (!open || !onRequestClose) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onRequestClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onRequestClose]);

  if (!open) {
    return null;
  }

  const icon = prefixIcon ?? defaultVariantIcon(variant);

  return (
    <div
      className="t3d-shell-overlay fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      {onRequestClose ? (
        <button
          type="button"
          className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-[2px]"
          aria-label="Close alert"
          onClick={onRequestClose}
        />
      ) : (
        <div
          className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
          aria-hidden
        />
      )}
      <div
        role="alert"
        aria-live="assertive"
        className={twMerge(
          "relative max-h-[min(640px,calc(100vh-2rem))] w-full max-w-md overflow-y-auto rounded-xl border px-4 py-4 shadow-2xl",
          variantPanelClass(variant),
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        <div className="flex gap-3">
          <div
            className={twMerge(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
              variantIconWrapClass(variant),
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1 text-left">{children}</div>
        </div>
      </div>
    </div>
  );
}
