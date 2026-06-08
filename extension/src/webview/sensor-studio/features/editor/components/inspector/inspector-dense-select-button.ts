import { TRN_GLASS_DROPDOWN_TEXT_CLASS } from "../../../../../ui/components/toolbar-header-dropdown-menu-ui";

/** Shared {@link TRNSelect} trigger chrome for inspector dense rows (matches numeric/text shell height). */
export const INSPECTOR_DENSE_SELECT_BUTTON_CLASS =
  `min-h-[26px] border-zinc-700/80 bg-zinc-950/45 px-1 py-0.5 font-medium tracking-normal text-zinc-100 shadow-none hover:bg-zinc-900/70 ${TRN_GLASS_DROPDOWN_TEXT_CLASS}`;

/** Flow node cards + outliner — compact height; trigger text matches glass menu rows. */
export const STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS =
  `min-h-7 ${TRN_GLASS_DROPDOWN_TEXT_CLASS}`;

export const STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS =
  `${STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS} w-full`;

/** Fixed `h-7` selects in tight node rows (e.g. material texture picker). */
export const STUDIO_COMPACT_FLOW_SELECT_BUTTON_H7_FULL_WIDTH_CLASS =
  `h-7 w-full min-w-0 max-w-full ${TRN_GLASS_DROPDOWN_TEXT_CLASS}`;
