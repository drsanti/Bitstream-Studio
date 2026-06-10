import {
  BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS,
} from "../../bitstream-shell/ui/workspace-chrome-chip";

/** Bitstream shell toolbar chip typography (11px medium, tracking-wide). */
export const COURSE_STUDIO_TOPBAR_CHIP_TEXT_CLASS = BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS;

/** Left title stack — matches shell chip scale (not Presentation `text-sm`). */
export const COURSE_STUDIO_TOPBAR_TITLE_CLASS =
  "truncate font-sans text-[11px] font-semibold leading-none tracking-wide text-[var(--text-primary)]";

/** Page name + session flags — inspector secondary scale (10px, tight leading). */
export const COURSE_STUDIO_TOPBAR_SUBTITLE_CLASS =
  "truncate font-sans text-[10px] font-medium leading-none tracking-wide text-[var(--text-muted)]";

/** Title stack wrapper — keep gap in sync with brand icon height calc. */
export const COURSE_STUDIO_TOPBAR_TITLE_STACK_CLASS = "flex min-w-0 flex-col gap-0.5";

/** Graduation cap — height spans title + subtitle rows (11px + 2px gap + 10px). */
export const COURSE_STUDIO_TOPBAR_BRAND_ICON_PX = 23;

export const COURSE_STUDIO_TOPBAR_BRAND_ICON_CLASS =
  "course-studio-topbar-brand-icon shrink-0 text-[var(--accent-amber)]";

/** Shared pill frame for Course Studio topbar controls and badges. */
export const COURSE_STUDIO_TOPBAR_CHIP_CLASS = `${BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS} h-[21px] ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS}`;

export const COURSE_STUDIO_TOPBAR_CHIP_ICON_CLASS = BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS;

export const COURSE_STUDIO_TOPBAR_ACTION_CLASS = `course-studio-topbar-control ${COURSE_STUDIO_TOPBAR_CHIP_CLASS}`;

/** One-shot mount when unsaved edits appear (Save + Discard pair). */
export const COURSE_STUDIO_TOPBAR_ACTION_ENTER_CLASS = "course-studio-topbar-action-enter";

/** Emerald breathe — page/outline dirty and save is actionable. */
export const COURSE_STUDIO_TOPBAR_SAVE_READY_CLASS = "course-studio-topbar-save--ready";

/** Static emerald while the dev save request is in flight. */
export const COURSE_STUDIO_TOPBAR_SAVE_SAVING_CLASS = "course-studio-topbar-save--saving";

export const COURSE_STUDIO_TOPBAR_ICON_BTN_CLASS =
  "course-studio-topbar-control inline-flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border";

export const COURSE_STUDIO_TOPBAR_LAYOUT_MENU_CLASS = `course-studio-topbar-control inline-flex h-[21px] shrink-0 items-center justify-center gap-1 rounded-full border border-sky-800/60 bg-sky-950/30 px-2 py-1 ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS} text-sky-100/90 hover:bg-sky-900/25`;

export const COURSE_STUDIO_TOPBAR_BADGE_CLASS = COURSE_STUDIO_TOPBAR_CHIP_CLASS;

/** Centered Edit / Read mode segmented pill. */
export const COURSE_STUDIO_MODE_PILL_CLASS =
  "course-studio-mode-pill pointer-events-auto inline-flex h-[25px] items-center gap-0.5 rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)]/55 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export const COURSE_STUDIO_MODE_PILL_SEGMENT_CLASS =
  "course-studio-mode-pill__segment inline-flex h-[21px] shrink-0 box-border items-center justify-center rounded-full border px-3 font-sans text-[11px] font-medium leading-none tracking-wide transition-colors";

export const COURSE_STUDIO_MODE_PILL_SEGMENT_INACTIVE_CLASS =
  "course-studio-mode-pill__segment--inactive border-transparent text-[var(--text-muted)] hover:border-[var(--surface-border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]";

export const COURSE_STUDIO_MODE_PILL_SEGMENT_EDIT_ACTIVE_CLASS =
  "course-studio-mode-pill__segment--active course-studio-mode-pill__segment--edit border-amber-500/50 bg-amber-500/20 font-semibold text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

export const COURSE_STUDIO_MODE_PILL_SEGMENT_READ_ACTIVE_CLASS =
  "course-studio-mode-pill__segment--active course-studio-mode-pill__segment--read border-sky-500/50 bg-sky-500/20 font-semibold text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

export const COURSE_STUDIO_MODE_PILL_TOOLTIP_CLASS = "inline-flex shrink-0 items-center self-center";

export const COURSE_STUDIO_MODE_PILL_TOOLTIP_TRIGGER_CLASS =
  "!m-0 inline-flex h-[21px] items-center justify-center !rounded-full !p-0";
