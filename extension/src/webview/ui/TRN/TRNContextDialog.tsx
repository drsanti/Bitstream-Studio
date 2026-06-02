import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type TRNContextDialogAnchor = { x: number; y: number };

export type TRNContextDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  anchor: TRNContextDialogAnchor | null;
  widthPx?: number;
  zIndex?: number;
  /** Optional additional className for the outer panel shell. */
  panelClassName?: string;
  children: ReactNode;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function TRNContextDialog(props: TRNContextDialogProps) {
  const {
    open,
    onOpenChange,
    title,
    anchor,
    widthPx = 420,
    zIndex = 2400,
    panelClassName,
    children,
  } = props;
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const panelRef = useRef<HTMLDivElement | null>(null);

  const style = useMemo((): CSSProperties => {
    if (typeof window === "undefined" || anchor == null) {
      return { top: 80, left: 80, width: widthPx };
    }
    const PAD = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = clamp(anchor.x, PAD, Math.max(PAD, vw - widthPx - PAD));
    // Place a little below the cursor, but clamp to viewport.
    const top = clamp(anchor.y + 8, PAD, Math.max(PAD, vh - 260));
    return { top, left, width: widthPx };
  }, [anchor, widthPx]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onOpenChange(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onOpenChange, open]);

  if (!open || anchor == null || portalTarget == null) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex }}
      aria-hidden={false}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-label={title}
        className="pointer-events-auto fixed"
        style={style}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={twMerge(
            // Dark “clay” card chrome (matches TRNCard glassPreset="soft").
            "relative overflow-hidden rounded-md border border-zinc-700/85 bg-zinc-900/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm",
            panelClassName,
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-zinc-700/80 bg-linear-to-r from-zinc-900/70 to-zinc-800/55 px-3 py-1">
            <div className="min-w-0 truncate text-xs font-semibold text-zinc-100">
              {title}
            </div>
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-700/70 bg-zinc-900/55 text-zinc-200 transition-colors hover:border-zinc-600/80 hover:bg-zinc-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45"
              aria-label="Close dialog"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" aria-hidden strokeWidth={2.25} />
            </button>
          </div>
          <div className="space-y-3 px-3 py-2">{children}</div>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}

