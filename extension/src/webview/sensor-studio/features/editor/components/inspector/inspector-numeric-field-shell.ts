/** Shared dense control chrome for inspector text + numeric fields. */
export const INSPECTOR_DENSE_FIELD_SHELL =
  "flex min-h-[26px] min-w-0 items-center gap-1 rounded border border-zinc-700/80 bg-zinc-950/45 px-1 py-0.5";

/** Inner input styling inside {@link INSPECTOR_DENSE_FIELD_SHELL}. */
export const INSPECTOR_DENSE_FIELD_INNER_CLASS =
  "min-w-0 flex-1 bg-transparent px-1 text-[11px] leading-none text-zinc-100 outline-none placeholder:text-zinc-600";

/** Inner color input styling inside {@link INSPECTOR_DENSE_FIELD_SHELL}. */
export const INSPECTOR_DENSE_COLOR_INNER_CLASS =
  "h-[26px] min-h-[26px] w-full cursor-pointer border-0 bg-transparent p-0";

/** @deprecated Use {@link INSPECTOR_DENSE_FIELD_SHELL}. */
export const INSPECTOR_DENSE_NUMERIC_FIELD_SHELL = INSPECTOR_DENSE_FIELD_SHELL;
