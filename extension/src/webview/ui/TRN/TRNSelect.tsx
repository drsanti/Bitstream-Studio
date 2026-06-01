import { ChevronDown, Check } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { TRNIconButton } from "./TRNIconButton.js";
import {
  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
  TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME,
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "./TRNMenu.js";

export type TRNSelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  /** Leading glyph in listbox rows (and optional trigger context). */
  icon?: ReactNode;
};

export type TRNSelectProps = {
  value: string;
  options: TRNSelectOption[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
  /** Optional heading above options (same caps style as assistant tool menus). */
  sectionTitle?: ReactNode;
  /** Full-width row trigger (default) or compact **`TRNIconButton`** + anchored menu. */
  trigger?: "default" | "icon";
  /** `trigger="icon"` — glyph inside the square button (falls back to **`leadingIcon`**). */
  iconTrigger?: ReactNode;
  /** Extra classes on the icon trigger (`TRNIconButton`). */
  iconButtonClassName?: string;
  /** Shown before the selected label on the trigger (e.g. environment / scene icon). */
  leadingIcon?: ReactNode;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
};

type MenuBox = {
  top: number;
  left: number;
  width: number;
};

export function TRNSelect(props: TRNSelectProps) {
  const {
    value,
    options,
    onValueChange,
    ariaLabel,
    sectionTitle,
    trigger = "default",
    iconTrigger,
    iconButtonClassName,
    leadingIcon,
    size = "md",
    disabled = false,
    className,
    buttonClassName,
    panelClassName,
  } = props;
  const sectionHeadingId = useId();
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<MenuBox | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }

    const updateMenuBox = () => {
      const root = rootRef.current;
      if (root == null) {
        return;
      }
      const rect = root.getBoundingClientRect();
      if (trigger === "icon") {
        const panelWidth = Math.min(window.innerWidth * 0.92, 288);
        let left = rect.left + rect.width / 2 - panelWidth / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
        setMenuBox({ top: rect.bottom + 4, left, width: panelWidth });
      } else {
        setMenuBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
    };

    updateMenuBox();
    window.addEventListener("resize", updateMenuBox);
    window.addEventListener("scroll", updateMenuBox, true);
    return () => {
      window.removeEventListener("resize", updateMenuBox);
      window.removeEventListener("scroll", updateMenuBox, true);
    };
  }, [open, trigger]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (evt: PointerEvent) => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (root == null) {
        return;
      }
      const t = evt.target;
      if (t instanceof Node && !root.contains(t) && !(menu?.contains(t) ?? false)) {
        setOpen(false);
      }
    };
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        evt.preventDefault();
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

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const menuPanel =
    open && menuBox != null && portalTarget != null
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-10000 outline-none"
            style={{
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
          >
            <TRNMenuPanel
              tone="glass-dropdown"
              className={twMerge(
                "max-h-[min(320px,50vh)] overflow-y-auto scrollbar-hide",
                panelClassName,
              )}
            >
              <div className="flex flex-col gap-1">
                {sectionTitle != null ? (
                  <TRNMenuSectionTitle id={sectionHeadingId} spacing="menuFirst">
                    {sectionTitle}
                  </TRNMenuSectionTitle>
                ) : null}
                <div
                  role="listbox"
                  aria-label={sectionTitle != null ? undefined : ariaLabel}
                  aria-labelledby={sectionTitle != null ? sectionHeadingId : undefined}
                  className="flex flex-col gap-1"
                >
                  {options.map((opt) => {
                    const optDisabled = disabled || opt.disabled === true;
                    const isSelected = opt.value === value;
                    return (
                      <TRNMenuItemButton
                        key={opt.value}
                        tone="glass-dropdown"
                        role="option"
                        disabled={optDisabled}
                        aria-disabled={optDisabled}
                        aria-selected={isSelected}
                        label={opt.label}
                        icon={opt.icon}
                        className={twMerge(
                          TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                          "font-sans font-medium tracking-wide",
                          size === "sm"
                            ? "text-xs"
                            : size === "lg"
                              ? "text-sm"
                              : "text-sm",
                          isSelected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                        )}
                        rightSlot={
                          isSelected ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                          ) : null
                        }
                        onClick={() => {
                          if (optDisabled) {
                            return;
                          }
                          onValueChange(opt.value);
                          setOpen(false);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </TRNMenuPanel>
          </div>,
          portalTarget,
        )
      : null;

  if (trigger === "icon") {
    const glyph = iconTrigger ?? leadingIcon ?? (
      <ChevronDown className="h-4 w-4 text-zinc-300" aria-hidden />
    );
    return (
      <div ref={rootRef} className={twMerge("relative inline-block", className)}>
        <TRNIconButton
          label={ariaLabel}
          icon={glyph}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={twMerge(
            "pointer-events-auto border-zinc-700/80 bg-zinc-900/90 text-zinc-200 shadow-md backdrop-blur-sm hover:bg-zinc-800/95",
            iconButtonClassName,
          )}
          onClick={() => {
            if (!disabled) {
              setOpen((v) => !v);
            }
          }}
        />
        {menuPanel}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={twMerge("relative w-full", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((v) => !v);
          }
        }}
        className={twMerge(
          "inline-flex w-full items-center gap-2 rounded-md border border-white/15 " +
            "bg-black/55 px-2.5 font-sans text-xs font-semibold tracking-wide text-zinc-100 " +
            "shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl " +
            "transition-colors hover:bg-black/65 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 " +
            "disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm"
            ? "py-1"
            : size === "lg"
              ? "py-2 text-sm"
              : "py-1.5",
          buttonClassName,
        )}
      >
        {leadingIcon ? (
          <span className="inline-flex shrink-0 items-center text-zinc-400 [&_svg]:shrink-0" aria-hidden>
            {leadingIcon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label ?? value}</span>
        <ChevronDown
          className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-400"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        />
      </button>

      {menuPanel}
    </div>
  );
}

