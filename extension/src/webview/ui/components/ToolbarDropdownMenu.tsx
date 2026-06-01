import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { useFixedMenuAnchor } from "../hooks/useFixedMenuAnchor";

export type ToolbarDropdownMenuProps = {
  label: string;
  hint?: string;
  prefixIcon?: ReactNode;
  buttonClassName?: string;
  panelClassName?: string;
  align?: "left" | "right";
  children: ReactNode;
};

const DEFAULT_BTN_CLASS =
  "inline-flex items-center gap-1 rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-200/90 hover:bg-zinc-800/80";

/**
 * Header toolbar dropdown — portaled with viewport-aware placement (no overflow clip).
 */
export function ToolbarDropdownMenu(props: ToolbarDropdownMenuProps) {
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { placement, panelRef } = useFixedMenuAnchor(open, triggerRef, align);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
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
  }, [open, panelRef]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const menuPanel =
    open && portalTarget != null
      ? createPortal(
          <div
            ref={panelRef}
            className={twMerge("fixed z-10000 outline-none", panelClassName)}
            style={{
              top: placement?.top ?? -9999,
              left: placement?.left ?? -9999,
              visibility: placement?.positioned ? "visible" : "hidden",
              pointerEvents: placement?.positioned ? "auto" : "none",
            }}
            role="presentation"
            onClick={() => setOpen(false)}
          >
            {children}
          </div>,
          portalTarget,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={hint != null ? `${label}. ${hint}` : label}
        className={twMerge(DEFAULT_BTN_CLASS, buttonClassName)}
        onClick={() => setOpen((value) => !value)}
      >
        {prefixIcon}
        {label}
        <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
      </button>
      {menuPanel}
    </>
  );
}
