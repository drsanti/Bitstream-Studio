import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRN_HINT_HOVER_DELAY_MS } from "../../../../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../../../../ui/TRN/TRNTooltip";

export const STUDIO_TOOLBAR_MENU_BTN_CLASS =
  "inline-flex items-center gap-1 rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-200/90 hover:bg-zinc-800/80";

export const STUDIO_TOOLBAR_DIVIDER_CLASS = "mx-0.5 h-4 w-px shrink-0 bg-zinc-600/60";

export type StudioToolbarMenuProps = {
  label: string;
  hint?: string;
  prefixIcon?: ReactNode;
  buttonClassName?: string;
  panelClassName?: string;
  align?: "left" | "right";
  children: ReactNode;
};

/** Compact header dropdown — same TRN menu chrome as {@link WorkbenchLayoutMenu}. */
export function StudioToolbarMenu(props: StudioToolbarMenuProps) {
  const {
    label,
    hint,
    prefixIcon,
    buttonClassName,
    panelClassName,
    align = "left",
    children,
  } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const trigger = (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      className={twMerge(STUDIO_TOOLBAR_MENU_BTN_CLASS, buttonClassName)}
      onClick={() => setOpen((value) => !value)}
    >
      {prefixIcon}
      {label}
      <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
    </button>
  );

  return (
    <div className="relative shrink-0" ref={rootRef}>
      {hint != null ? (
        <TRNTooltip content={hint} side="bottom" delayMs={TRN_HINT_HOVER_DELAY_MS}>
          {trigger}
        </TRNTooltip>
      ) : (
        trigger
      )}
      {open ? (
        <div
          className={twMerge(
            "absolute top-full z-[70] mt-1",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
