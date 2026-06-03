import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import {
  TRN_FLOATING_MENU_DEFAULT_MAX_HEIGHT_PX,
  TRN_FLOATING_MENU_GAP_PX,
  TRN_FLOATING_MENU_VIEWPORT_PADDING_PX,
  resolveTrnFloatingMenuHorizontal,
  resolveTrnFloatingMenuPlacement,
} from "./trn-floating-menu-placement.js";
import { TRNIconButton } from "./TRNIconButton.js";
import {
  TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS,
  TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS,
} from "../components/toolbar-header-dropdown-menu-ui.js";
import {
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
  /** Trailing content on the row (e.g. source badge). */
  rightSlot?: ReactNode;
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
  /** Trigger chrome preset. */
  variant?: "field" | "glass";
  /** If true, uses the selected option's `icon` as the trigger leading icon (unless `leadingIcon` is set). */
  showSelectedIconInTrigger?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  /** Alias for `buttonClassName` (used across Sensor Studio / inspector). */
  triggerClassName?: string;
  panelClassName?: string;
};

const TRN_SELECT_TRIGGER_BASE_CLASS =
  "inline-flex w-full items-center gap-2 rounded-md px-2.5 font-sans text-[13px] font-normal leading-tight text-zinc-100 " +
  "shadow-[0_16px_48px_-16px_rgba(0,0,0,0.35)] backdrop-blur-2xl " +
  "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const TRN_SELECT_TRIGGER_VARIANT_CLASS: Record<NonNullable<TRNSelectProps["variant"]>, string> = {
  field: "border border-zinc-700/80 bg-zinc-950/45 hover:bg-zinc-950/55",
  glass:
    "border border-white/15 bg-black/70 ring-1 ring-white/10 hover:bg-black/80",
};

type MenuBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function estimateMenuHeightPx(optionCount: number): number {
  const rowPx = 34;
  const chromePx = 12;
  return Math.min(TRN_FLOATING_MENU_DEFAULT_MAX_HEIGHT_PX, optionCount * rowPx + chromePx);
}

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
    variant = "field",
    showSelectedIconInTrigger = true,
    size = "md",
    disabled = false,
    className,
    buttonClassName,
    triggerClassName,
    panelClassName,
  } = props;
  const mergedTriggerClassName = twMerge(buttonClassName, triggerClassName);
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
      const measuredHeight = menuRef.current?.offsetHeight ?? estimateMenuHeightPx(options.length);
      const placement = resolveTrnFloatingMenuPlacement({
        triggerRect: rect,
        menuHeightPx: measuredHeight,
      });

      if (trigger === "icon") {
        const panelWidth = Math.min(window.innerWidth * 0.92, 288);
        let left = rect.left + rect.width / 2 - panelWidth / 2;
        left = Math.max(
          TRN_FLOATING_MENU_VIEWPORT_PADDING_PX,
          Math.min(left, window.innerWidth - panelWidth - TRN_FLOATING_MENU_VIEWPORT_PADDING_PX),
        );
        setMenuBox({
          left,
          width: panelWidth,
          top: placement.top,
          maxHeight: placement.maxHeight,
        });
      } else {
        const horizontal = resolveTrnFloatingMenuHorizontal({
          triggerRect: rect,
          panelWidthPx: rect.width,
        });
        setMenuBox({
          ...horizontal,
          top: placement.top,
          maxHeight: placement.maxHeight,
        });
      }
    };

    updateMenuBox();
    const raf = window.requestAnimationFrame(updateMenuBox);
    window.addEventListener("resize", updateMenuBox);
    window.addEventListener("scroll", updateMenuBox, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateMenuBox);
      window.removeEventListener("scroll", updateMenuBox, true);
    };
  }, [open, options.length, trigger]);

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
              edgeAutoScroll
              className={twMerge(TOOLBAR_HEADER_DROPDOWN_MENU_PANEL_CLASS, panelClassName)}
              style={{ maxHeight: menuBox.maxHeight }}
            >
              <div className="flex flex-col gap-0.5">
                {sectionTitle != null ? (
                  <TRNMenuSectionTitle id={sectionHeadingId} spacing="menuFirst">
                    {sectionTitle}
                  </TRNMenuSectionTitle>
                ) : null}
                <div
                  role="listbox"
                  aria-label={sectionTitle != null ? undefined : ariaLabel}
                  aria-labelledby={sectionTitle != null ? sectionHeadingId : undefined}
                  className="flex flex-col gap-0.5"
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
                          TOOLBAR_HEADER_DROPDOWN_MENU_ITEM_CLASS,
                          size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : null,
                          isSelected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                        )}
                        rightSlot={opt.rightSlot ?? null}
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
          TRN_SELECT_TRIGGER_BASE_CLASS,
          TRN_SELECT_TRIGGER_VARIANT_CLASS[variant],
          size === "sm"
            ? "py-1 text-xs"
            : size === "lg"
              ? "py-2 text-sm"
              : "py-1.5",
          mergedTriggerClassName,
        )}
      >
        {leadingIcon ?? (showSelectedIconInTrigger ? selected?.icon : null) ? (
          <span className="inline-flex shrink-0 items-center text-zinc-400 [&_svg]:shrink-0" aria-hidden>
            {leadingIcon ?? (showSelectedIconInTrigger ? selected?.icon : null)}
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

