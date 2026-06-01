import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { ToolbarDropdownMenu } from "../../../../../ui/components/ToolbarDropdownMenu";

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

/** Compact header dropdown — portaled so shell scroll regions do not clip the panel. */
export function StudioToolbarMenu(props: StudioToolbarMenuProps) {
  const { buttonClassName, ...rest } = props;

  return (
    <div className="relative shrink-0">
      <ToolbarDropdownMenu
        {...rest}
        buttonClassName={twMerge(STUDIO_TOOLBAR_MENU_BTN_CLASS, buttonClassName)}
      />
    </div>
  );
}
