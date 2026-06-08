import { twMerge } from "tailwind-merge";
import type { ReactNode } from "react";
import {
  TRNMenuPanel,
  TRNMenuScrollRegion,
  type TRNMenuPanelTone,
} from "./TRNMenu.js";
import {
  shouldShowTrnMenuSearch,
  TRNMenuSearchField,
  TRNMenuSearchProvider,
} from "./TRNMenuSearch.js";

export type TRNSearchableMenuShellProps = {
  /** When false, clears the search query (dropdown close). Default true. */
  menuOpen?: boolean;
  itemCount: number;
  tone?: TRNMenuPanelTone;
  panelClassName?: string;
  scrollClassName?: string;
  maxHeightClassName?: string;
  children: ReactNode;
};

/**
 * Glass menu panel with optional search (when {@link itemCount} > 5) and edge auto-scroll body.
 */
export function TRNSearchableMenuShell(props: TRNSearchableMenuShellProps) {
  const {
    menuOpen = true,
    itemCount,
    tone = "glass-dropdown",
    panelClassName,
    scrollClassName,
    maxHeightClassName = "max-h-[min(70vh,32rem)]",
    children,
  } = props;

  const showSearch = shouldShowTrnMenuSearch(itemCount);

  return (
    <TRNMenuSearchProvider menuOpen={menuOpen}>
      <TRNMenuPanel
        tone={tone}
        className={twMerge(
          "flex flex-col overflow-hidden !p-0",
          showSearch ? maxHeightClassName : null,
          panelClassName,
        )}
      >
        {showSearch ? <TRNMenuSearchField /> : null}
        <TRNMenuScrollRegion
          edgeAutoScroll={showSearch}
          className={twMerge(
            showSearch ? "min-h-0 flex-1 px-1.5 py-1.5" : null,
            scrollClassName,
          )}
        >
          {children}
        </TRNMenuScrollRegion>
      </TRNMenuPanel>
    </TRNMenuSearchProvider>
  );
}
