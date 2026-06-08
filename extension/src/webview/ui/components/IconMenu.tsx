import React from "react";
import { twMerge } from "tailwind-merge";
import {
  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
  TRNMenuItemButton,
} from "../TRN/TRNMenu.js";
import { TRNSearchableMenuShell } from "../TRN/TRNSearchableMenuShell.js";
import { useTRNMenuItemMatches } from "../TRN/TRNMenuSearch.js";

export interface IconMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  title?: string;
  className?: string;
}

export interface IconMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerIcon: React.ReactNode;
  triggerTitle?: string;
  /** Merged onto the root wrapper (default: `relative`). Use for z-index/stacking. */
  containerClassName?: string;
  triggerClassName?: string;
  menuClassName?: string;
  itemClassName?: string;
  items: IconMenuItem[];
}

export const IconMenu: React.FC<IconMenuProps> = ({
  open,
  onOpenChange,
  triggerIcon,
  triggerTitle,
  containerClassName,
  triggerClassName,
  menuClassName,
  itemClassName,
  items,
}) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  const triggerBaseClassName =
    "inline-flex items-center justify-center p-1 text-gray-300 hover:text-cyan-300 bg-transparent border-transparent shadow-none";

  return (
    <div className={twMerge("relative", containerClassName)} ref={rootRef}>
      <button
        type="button"
        className={triggerClassName ?? triggerBaseClassName}
        onClick={() => onOpenChange(!open)}
        title={triggerTitle}
      >
        {triggerIcon}
      </button>
      {open ? (
        <div
          className={twMerge(
            "absolute right-0 top-full z-[60] mt-2 w-auto min-w-44",
            menuClassName,
          )}
        >
          <TRNSearchableMenuShell
            menuOpen={open}
            itemCount={items.length}
            maxHeightClassName="max-h-64"
          >
            <div className="flex flex-col gap-1" role="menu">
              {items.map((item) => (
                <IconMenuRow
                  key={item.id}
                  item={item}
                  itemClassName={itemClassName}
                  onSelect={() => {
                    onOpenChange(false);
                    item.onSelect();
                  }}
                />
              ))}
            </div>
          </TRNSearchableMenuShell>
        </div>
      ) : null}
    </div>
  );
};

function IconMenuRow(props: {
  item: IconMenuItem;
  itemClassName?: string;
  onSelect: () => void;
}) {
  const { item, itemClassName, onSelect } = props;
  const visible = useTRNMenuItemMatches(item.label);
  if (!visible) {
    return null;
  }
  return (
    <TRNMenuItemButton
      tone="glass-dropdown"
      role="menuitem"
      icon={item.icon}
      label={item.label}
      title={item.title}
      className={twMerge(
        TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
        "text-xs font-medium",
        itemClassName,
        item.className,
      )}
      onClick={onSelect}
    />
  );
}

