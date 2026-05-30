import { useMemo, type ReactNode } from "react";
import {
  HeaderMenuDropdownPanel,
  useHeaderMenuDropdown,
  type HeaderMenuDropdownPanelProps,
  type UseHeaderMenuDropdownOptions,
  type UseHeaderMenuDropdownResult,
} from "./header-menu-dropdown";

export type UseGlassModalHamburgerMenuResult = UseHeaderMenuDropdownResult & {
  /** Pass to `DraggableGlassModal` `onMenuClick`. */
  onMenuClick: () => void;
  /** Close the dropdown (e.g. after choosing a menu item). */
  closeMenu: () => void;
};

/**
 * State and refs for a `DraggableGlassModal` title-bar hamburger: toggle, outside dismiss,
 * Escape, and a portaled menu via {@link GlassModalHamburgerMenuPanel}.
 */
export function useGlassModalHamburgerMenu(
  options?: UseHeaderMenuDropdownOptions,
): UseGlassModalHamburgerMenuResult {
  const base = useHeaderMenuDropdown(options);
  return useMemo(
    () => ({
      ...base,
      onMenuClick: base.toggle,
      closeMenu: base.close,
    }),
    [base],
  );
}

export type GlassModalHamburgerMenuPanelProps = Omit<
  HeaderMenuDropdownPanelProps,
  "open" | "menuPanelRef"
> & {
  /** Value returned from {@link useGlassModalHamburgerMenu} (or {@link useHeaderMenuDropdown}). */
  menu: Pick<UseHeaderMenuDropdownResult, "open" | "menuPanelRef">;
  children: ReactNode;
};

/**
 * Dropdown anchored to the glass modal menu button; pass {@link useGlassModalHamburgerMenu}
 * as `menu` and the same `glassModalPanelId` as `DraggableGlassModal` `panelId`.
 */
export function GlassModalHamburgerMenuPanel({
  menu,
  children,
  ...panelProps
}: GlassModalHamburgerMenuPanelProps) {
  return (
    <HeaderMenuDropdownPanel
      open={menu.open}
      menuPanelRef={menu.menuPanelRef}
      {...panelProps}
    >
      {children}
    </HeaderMenuDropdownPanel>
  );
}
