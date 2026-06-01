import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { ToolbarDropdownMenu } from "../../../../../ui/components/ToolbarDropdownMenu";
import { WORKSPACE_CHROME_TOOLBAR_BTN_CLASS } from "../../../../../ui/components/workspace-chrome-toolbar-ui";

/** @deprecated Use {@link WORKSPACE_CHROME_TOOLBAR_BTN_CLASS} — kept for existing imports. */
export const STUDIO_TOOLBAR_MENU_BTN_CLASS = WORKSPACE_CHROME_TOOLBAR_BTN_CLASS;

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
