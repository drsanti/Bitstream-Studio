import React from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { Check, ChevronDown } from "lucide-react";
import {
  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
  TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME,
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuScrollRegion,
} from "../TRN/TRNMenu.js";
import {
  matchesTrnMenuSearch,
  shouldShowTrnMenuSearch,
  TRNMenuNoResults,
  TRNMenuSearchField,
} from "../TRN/TRNMenuSearch.js";

export interface GlassDropdownOption {
  value: string;
  label: string;
}

export interface GlassDropdownProps {
  value: string;
  options: GlassDropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  /** Merged onto the trigger button (e.g. darker glass for model catalog). */
  triggerClassName?: string;
  /** Merged onto the floating listbox panel. */
  menuClassName?: string;
}

export const GlassDropdown: React.FC<GlassDropdownProps> = ({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  triggerClassName,
  menuClassName,
}) => {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const lastTriggerRectRef = React.useRef<DOMRect | null>(null);
  const [open, setOpen] = React.useState(false);
  const [filterQuery, setFilterQuery] = React.useState("");
  const showMenuSearch = shouldShowTrnMenuSearch(options.length);

  React.useEffect(() => {
    if (!open) {
      setFilterQuery("");
    }
  }, [open]);

  const visibleOptions = React.useMemo(() => {
    if (!showMenuSearch) {
      return options;
    }
    return options.filter((option) => matchesTrnMenuSearch(filterQuery, option.label));
  }, [filterQuery, options, showMenuSearch]);
  const [menuPos, setMenuPos] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const computeMenuPos = React.useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    lastTriggerRectRef.current = rect ?? null;
    if (!rect) return null;
    return {
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    };
  }, []);

  const effectiveMenuPos = menuPos
    ? menuPos
    : lastTriggerRectRef.current
      ? {
          top: lastTriggerRectRef.current.bottom + 6,
          left: lastTriggerRectRef.current.left,
          width: lastTriggerRectRef.current.width,
        }
      : null;

  const selectedLabel = React.useMemo(() => {
    return options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";
  }, [options, value]);

  React.useEffect(() => {
    if (!open) return;

    const updatePos = () => {
      const computed = computeMenuPos();
      if (!computed) return;
      setMenuPos(computed);
    };

    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
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
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [computeMenuPos, open]);

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        className={twMerge(
          "h-9 w-full flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1 text-sm text-gray-200 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20",
          triggerClassName,
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const computed = computeMenuPos();
          if (computed) setMenuPos(computed);
          setOpen(true);
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-300/80 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        effectiveMenuPos &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 outline-none"
            style={{
              top: effectiveMenuPos.top,
              left: effectiveMenuPos.left,
              width: effectiveMenuPos.width,
            }}
          >
            <TRNMenuPanel
              tone="glass-dropdown"
              className={twMerge(
                showMenuSearch ? "flex max-h-64 flex-col overflow-hidden !p-0" : "max-h-64 overflow-y-auto scrollbar-hide",
                menuClassName,
              )}
            >
              {showMenuSearch ? (
                <>
                  <TRNMenuSearchField
                    value={filterQuery}
                    onChange={setFilterQuery}
                    placeholder="Search…"
                  />
                  <TRNMenuScrollRegion edgeAutoScroll className="min-h-0 flex-1 px-1.5 py-1">
                    <div role="listbox" aria-label={ariaLabel} className="flex flex-col gap-1">
                      {visibleOptions.map((option) => {
                        const selected = option.value === value;
                        return (
                          <TRNMenuItemButton
                            key={option.value}
                            tone="glass-dropdown"
                            role="option"
                            aria-selected={selected}
                            label={option.label}
                            className={twMerge(
                              TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                              "text-sm font-medium",
                              selected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                            )}
                            rightSlot={
                              selected ? (
                                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                              ) : null
                            }
                            onClick={() => {
                              onChange(option.value);
                              setOpen(false);
                            }}
                          />
                        );
                      })}
                    </div>
                    <TRNMenuNoResults
                      visible={filterQuery.trim().length > 0 && visibleOptions.length === 0}
                    />
                  </TRNMenuScrollRegion>
                </>
              ) : (
                <div role="listbox" aria-label={ariaLabel} className="flex flex-col gap-1">
                  {visibleOptions.map((option) => {
                    const selected = option.value === value;
                    return (
                      <TRNMenuItemButton
                        key={option.value}
                        tone="glass-dropdown"
                        role="option"
                        aria-selected={selected}
                        label={option.label}
                        className={twMerge(
                          TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                          "text-sm font-medium",
                          selected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                        )}
                        rightSlot={
                          selected ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                          ) : null
                        }
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </TRNMenuPanel>
          </div>,
          document.body
        )}
    </div>
  );
};

