import {
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CircleAlert,
  Info,
  Lightbulb,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "./TRNButton.js";
import { TRNWindow, type TRNWindowRect } from "./TRNWindow.js";

export type TRNMessageDialogVariant =
  | "info"
  | "suggestion"
  | "warning"
  | "error";

export type TRNMessageDialogAction = {
  label: string;
  onClick: () => void;
};

export type TRNMessageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  variant?: TRNMessageDialogVariant;
  /** Overrides variant icon when set. */
  prefixIcon?: ReactNode;
  children: ReactNode;
  primaryAction?: TRNMessageDialogAction;
  secondaryAction?: TRNMessageDialogAction;
  tertiaryAction?: TRNMessageDialogAction;
  /** Primary button styling (default uses cyan `selected` tone). */
  primaryTone?: "default" | "danger";
  zIndex?: number;
};

function defaultVariantIcon(variant: TRNMessageDialogVariant): ReactNode {
  switch (variant) {
    case "info":
      return (
        <Info className="h-4 w-4 text-sky-400" strokeWidth={2.25} aria-hidden />
      );
    case "suggestion":
      return (
        <Lightbulb
          className="h-4 w-4 text-amber-400"
          strokeWidth={2.25}
          aria-hidden
        />
      );
    case "warning":
      return (
        <AlertTriangle
          className="h-4 w-4 text-amber-500"
          strokeWidth={2.25}
          aria-hidden
        />
      );
    case "error":
      return (
        <CircleAlert
          className="h-4 w-4 text-red-400"
          strokeWidth={2.25}
          aria-hidden
        />
      );
    default:
      return (
        <Info className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      );
  }
}

/** Fixed shell height so {@link TRNWindow} open/clamp logic does not strip vertical centering (auto-height uses a normalize path that clamps `y` to the top). */
const MESSAGE_DIALOG_SHELL_HEIGHT_PX = 380;

function computeCenteredRect(): Partial<TRNWindowRect> {
  if (typeof window === "undefined") {
    return {
      x: 120,
      y: 100,
      width: 420,
      height: MESSAGE_DIALOG_SHELL_HEIGHT_PX,
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(440, Math.max(300, vw - 48));
  const h = Math.min(MESSAGE_DIALOG_SHELL_HEIGHT_PX, Math.max(200, vh - 48));
  const x = Math.max(16, (vw - width) / 2);
  const y = Math.max(16, (vh - h) / 2);
  return { x, y, width, height: h };
}

/**
 * Compact modal message dialog on top of {@link TRNWindow}: glass chrome, variant icon,
 * body copy, and up to three actions. Backdrop does not dismiss (must use X or a button).
 */
export function TRNMessageDialog({
  open,
  onOpenChange,
  title,
  variant = "info",
  prefixIcon,
  children,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  primaryTone = "default",
  zIndex = 72,
}: TRNMessageDialogProps) {
  const [initialRect, setInitialRect] = useState<Partial<TRNWindowRect>>(
    computeCenteredRect,
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setInitialRect(computeCenteredRect());
  }, [open]);

  const icon = prefixIcon ?? defaultVariantIcon(variant);

  const primaryClassName =
    primaryTone === "danger"
      ? "border-red-700/80 bg-red-950/50 text-red-100 hover:bg-red-900/55"
      : undefined;

  const runClose = () => {
    onOpenChange(false);
  };

  const wrapAction = (action: TRNMessageDialogAction, closeAfter: boolean) => {
    action.onClick();
    if (closeAfter) {
      runClose();
    }
  };

  return (
    <TRNWindow
      open={open}
      title={title}
      prefixIcon={icon}
      onClose={runClose}
      initialRect={initialRect}
      minWidth={300}
      minHeight={120}
      modal
      modalBackdropCloses={false}
      draggable={false}
      resizable={false}
      showMaximize={false}
      showFooter={false}
      heightMode="fixed"
      glass
      glassPreset="medium"
      zIndex={zIndex}
      contentClassName="min-h-0 overflow-y-auto"
    >
      <div className="flex min-h-0 flex-col gap-3">
        <div className="wrap-break-word text-xs leading-relaxed text-zinc-300">
          {children}
        </div>
        {(tertiaryAction != null ||
          secondaryAction != null ||
          primaryAction != null) && (
          <div className="flex flex-row flex-wrap justify-end gap-2 pt-1">
            {tertiaryAction != null ? (
              <TRNButton
                size="compact"
                onClick={() => wrapAction(tertiaryAction, true)}
              >
                {tertiaryAction.label}
              </TRNButton>
            ) : null}
            {secondaryAction != null ? (
              <TRNButton
                size="compact"
                onClick={() => wrapAction(secondaryAction, true)}
              >
                {secondaryAction.label}
              </TRNButton>
            ) : null}
            {primaryAction != null ? (
              <TRNButton
                size="compact"
                selected={primaryTone === "default"}
                className={twMerge(primaryClassName)}
                onClick={() => wrapAction(primaryAction, true)}
              >
                {primaryAction.label}
              </TRNButton>
            ) : null}
          </div>
        )}
      </div>
    </TRNWindow>
  );
}
