import { twMerge } from "tailwind-merge";
import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";
import { titleBarClass, titleTextClass } from "./glass-modal-styles";

export type GlassModalTitleBarProps = {
  title: string;
  icon?: LucideIcon;
  menuIcon?: LucideIcon;
  closeIcon?: LucideIcon;
  onMenuClick?: () => void;
  onClose?: () => void;
  isDragging: boolean;
};

/** Draggable header: title (left); optional menu then close (right). */
export function GlassModalTitleBar({
  title,
  icon: Icon,
  menuIcon: MenuIconProp,
  closeIcon: CloseIconProp,
  onMenuClick,
  onClose,
  isDragging,
}: GlassModalTitleBarProps) {
  const MenuIcon = MenuIconProp ?? Menu;
  const CloseIcon = CloseIconProp ?? X;

  const actionButtonClass =
    "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-zinc-400 hover:bg-zinc-800/90 hover:text-zinc-200";

  return (
    <div
      className={twMerge(titleBarClass, !isDragging && "cursor-move")}
      data-drag-handle="true"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        ) : null}
        <div className={twMerge(titleTextClass, "min-w-0 truncate")}>{title}</div>
      </div>
      {/* Whole cluster opts out of drag so gap/padding hits do not start drag + swallow the click. */}
      <div
        className="flex shrink-0 items-center gap-0.5"
        data-drag-handle="false"
      >
        {onMenuClick ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={actionButtonClass}
            data-drag-handle="false"
            aria-label="Menu"
          >
            <MenuIcon className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={actionButtonClass}
            data-drag-handle="false"
            aria-label="Close modal"
          >
            <CloseIcon className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
