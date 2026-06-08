import React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
  TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME,
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuScrollRegion,
} from "../../TRN/TRNMenu.js";
import {
  matchesTrnMenuSearch,
  shouldShowTrnMenuSearch,
  TRNMenuNoResults,
  TRNMenuSearchField,
} from "../../TRN/TRNMenuSearch.js";
import { commonInputFieldClassName } from "./field-styles";

export interface DropdownListOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownListProps {
  value: string;
  options: readonly DropdownListOption[];
  onChange: (value: string) => void;
  /** Shown when `value` is empty or not found in `options`. */
  placeholder?: string;
  /** Visible label above the trigger (optional). */
  label?: string;
  id?: string;
  /** Accessible name when `label` is omitted. */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

const triggerChrome = twMerge(
  commonInputFieldClassName,
  "flex cursor-pointer items-center justify-between gap-2 text-left",
);

export function DropdownList({
  value,
  options,
  onChange,
  placeholder = "Select…",
  label,
  id: idProp,
  ariaLabel,
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
}: DropdownListProps) {
  const internalId = React.useId();
  const baseId = idProp ?? internalId;
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;

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
    const el = triggerRef.current;
    const rect = el?.getBoundingClientRect();
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

  const selected = React.useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const displayText = selected?.label ?? placeholder;

  const effectiveAriaLabel =
    ariaLabel ?? label ?? placeholder ?? "Dropdown list";

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
      if (event.key === "Escape") setOpen(false);
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
    <div className={twMerge("flex flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={triggerId} className="text-sm text-zinc-400">
          {label}
        </label>
      ) : null}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        className={twMerge(triggerChrome, triggerClassName)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={label ? undefined : effectiveAriaLabel}
        onClick={() => {
          if (disabled) return;
          if (open) {
            setOpen(false);
            return;
          }
          const computed = computeMenuPos();
          if (computed) setMenuPos(computed);
          setOpen(true);
        }}
      >
        <span
          className={twMerge(
            "min-w-0 flex-1 truncate",
            selected ? "text-zinc-100" : "text-zinc-500",
          )}
        >
          {displayText}
        </span>
        <ChevronDown
          className={twMerge(
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open &&
        effectiveMenuPos &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
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
                showMenuSearch
                  ? "flex max-h-64 flex-col overflow-hidden !p-0"
                  : "max-h-64 overflow-y-auto scrollbar-hide",
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
                    <div
                      role="listbox"
                      aria-labelledby={label ? triggerId : undefined}
                      aria-label={label ? undefined : effectiveAriaLabel}
                      className="flex flex-col gap-1"
                    >
                      {visibleOptions.map((option) => {
                        const isSelected = option.value === value;
                        const isDisabled = option.disabled === true;
                        return (
                          <TRNMenuItemButton
                            key={option.value}
                            tone="glass-dropdown"
                            role="option"
                            aria-selected={isSelected}
                            disabled={isDisabled}
                            aria-disabled={isDisabled}
                            label={option.label}
                            className={twMerge(
                              TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                              "text-sm font-medium",
                              isSelected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                            )}
                            rightSlot={
                              isSelected ? (
                                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                              ) : null
                            }
                            onClick={() => {
                              if (isDisabled) return;
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
                <div
                  role="listbox"
                  aria-labelledby={label ? triggerId : undefined}
                  aria-label={label ? undefined : effectiveAriaLabel}
                  className="flex flex-col gap-1"
                >
                  {visibleOptions.map((option) => {
                    const isSelected = option.value === value;
                    const isDisabled = option.disabled === true;
                    return (
                      <TRNMenuItemButton
                        key={option.value}
                        tone="glass-dropdown"
                        role="option"
                        aria-selected={isSelected}
                        disabled={isDisabled}
                        aria-disabled={isDisabled}
                        label={option.label}
                        className={twMerge(
                          TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                          "text-sm font-medium",
                          isSelected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                        )}
                        rightSlot={
                          isSelected ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                          ) : null
                        }
                        onClick={() => {
                          if (isDisabled) return;
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
          document.body,
        )}
    </div>
  );
}
