import { Search } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  TRNMenuItemButton,
  TRNMenuSectionTitle,
  type TRNMenuItemButtonProps,
  type TRNMenuSectionTitleSpacing,
} from "./TRNMenu.js";

/** Menus with more than this many items show a search field. */
export const TRN_MENU_SEARCH_MIN_ITEMS = 6;

export function shouldShowTrnMenuSearch(itemCount: number): boolean {
  return itemCount > TRN_MENU_SEARCH_MIN_ITEMS - 1;
}

export function matchesTrnMenuSearch(
  query: string,
  label: string,
  keywords: readonly string[] = [],
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const haystack = [label, ...keywords].join(" ").toLowerCase();
  return haystack.includes(q);
}

export function getTrnMenuOptionSearchLabel(label: ReactNode, fallback = ""): string {
  if (typeof label === "string") {
    return label;
  }
  if (typeof label === "number") {
    return String(label);
  }
  return fallback;
}

type TRNMenuSearchContextValue = {
  query: string;
  setQuery: (next: string) => void;
  itemMatches: (label: string, keywords?: readonly string[]) => boolean;
  sectionMatches: (labels: readonly string[]) => boolean;
  isSearching: boolean;
};

export const TRNMenuSearchContext = createContext<TRNMenuSearchContextValue | null>(null);

function useTRNMenuSearchContext(): TRNMenuSearchContextValue {
  const ctx = useContext(TRNMenuSearchContext);
  if (ctx == null) {
    throw new Error("TRN menu search hooks must be used under TRNMenuSearchProvider");
  }
  return ctx;
}

export function useOptionalTRNMenuSearchContext(): TRNMenuSearchContextValue | null {
  return useContext(TRNMenuSearchContext);
}

export function TRNMenuSearchProvider(props: {
  menuOpen: boolean;
  children: ReactNode;
}) {
  const { menuOpen, children } = props;
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!menuOpen) {
      setQuery("");
    }
  }, [menuOpen]);

  const itemMatches = useCallback(
    (label: string, keywords: readonly string[] = []) =>
      matchesTrnMenuSearch(query, label, keywords),
    [query],
  );

  const sectionMatches = useCallback(
    (labels: readonly string[]) => {
      if (!query.trim()) {
        return true;
      }
      return labels.some((label) => matchesTrnMenuSearch(query, label));
    },
    [query],
  );

  const value = useMemo(
    () => ({
      query,
      setQuery,
      itemMatches,
      sectionMatches,
      isSearching: query.trim().length > 0,
    }),
    [query, itemMatches, sectionMatches],
  );

  return (
    <TRNMenuSearchContext.Provider value={value}>{children}</TRNMenuSearchContext.Provider>
  );
}

export function useTRNMenuItemMatches(
  label: string,
  keywords: readonly string[] = [],
): boolean {
  const optional = useOptionalTRNMenuSearchContext();
  if (optional == null) {
    return true;
  }
  return optional.itemMatches(label, keywords);
}

/** Menu row hidden when search is active and the label/keywords do not match. */
export function TRNMenuSearchableRow(
  props: TRNMenuItemButtonProps & {
    searchLabel: string;
    searchKeywords?: readonly string[];
  },
) {
  const { searchLabel, searchKeywords, ...buttonProps } = props;
  const visible = useTRNMenuItemMatches(searchLabel, searchKeywords);
  if (!visible) {
    return null;
  }
  return <TRNMenuItemButton {...buttonProps} />;
}

export function useTRNMenuSearchState(): TRNMenuSearchContextValue {
  return useTRNMenuSearchContext();
}

export function TRNMenuSearchField(props: {
  autoFocus?: boolean;
  placeholder?: string;
  /** Controlled mode (no provider). */
  value?: string;
  onChange?: (next: string) => void;
}) {
  const {
    autoFocus = true,
    placeholder = "Search menu…",
    value: controlledValue,
    onChange: controlledOnChange,
  } = props;
  const ctx = useOptionalTRNMenuSearchContext();
  const query = controlledValue ?? ctx?.query ?? "";
  const setQuery = controlledOnChange ?? ctx?.setQuery;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(id);
    };
  }, [autoFocus]);

  if (setQuery == null) {
    return null;
  }

  return (
    <div className="shrink-0 border-b border-white/10 px-2 py-1.5">
      <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5">
        <Search size={12} className="shrink-0 text-zinc-500" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={placeholder}
          aria-label="Search menu"
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
        />
      </div>
    </div>
  );
}

export function TRNMenuFilterableSection(props: {
  title: string;
  itemLabels: readonly string[];
  spacing?: TRNMenuSectionTitleSpacing;
  children: ReactNode;
}) {
  const { title, itemLabels, spacing = "menuNext", children } = props;
  const search = useOptionalTRNMenuSearchContext();
  const sectionMatches = search?.sectionMatches ?? (() => true);

  if (!sectionMatches(itemLabels)) {
    return null;
  }

  return (
    <>
      <TRNMenuSectionTitle spacing={spacing}>{title}</TRNMenuSectionTitle>
      {children}
    </>
  );
}

export function TRNMenuNoResults(props: { visible: boolean }) {
  if (!props.visible) {
    return null;
  }
  return (
    <div className="px-3 py-5 text-center text-sm text-zinc-500" role="status">
      No matching menu items
    </div>
  );
}
