import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { TRNWindow } from "../TRNWindow.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_EXAMPLE_CATALOG_ITEMS,
  type ExampleGroup,
  type TRNCardExampleTab,
  type TRNCommandPaletteExampleTab,
  type TRNContainerExampleTab,
  type TRNAccordionExampleTab,
  type TRNDataGridExampleTab,
  type TRNFormExampleTab,
  type TRNAppLayoutExampleTab,
  type TRNSidePanelExampleTab,
  type TRNSplitPaneExampleTab,
  type TRNSortableCardExampleTab,
  type TRNSortableExampleTab,
  type TRNTabsExampleTab,
  type TRNTreeExampleTab,
  type TRNWindowExampleTab,
  type TRNToolboxPanelExampleTab,
} from "./exampleRegistry.js";

type CatalogSelection =
  | { group: "container"; tab: TRNContainerExampleTab }
  | { group: "window"; tab: TRNWindowExampleTab }
  | { group: "toolbox-panel"; tab: TRNToolboxPanelExampleTab }
  | { group: "card"; tab: TRNCardExampleTab }
  | { group: "tabs"; tab: TRNTabsExampleTab }
  | { group: "split-pane"; tab: TRNSplitPaneExampleTab }
  | { group: "command-palette"; tab: TRNCommandPaletteExampleTab }
  | { group: "data-grid"; tab: TRNDataGridExampleTab }
  | { group: "tree"; tab: TRNTreeExampleTab }
  | { group: "form"; tab: TRNFormExampleTab }
  | { group: "app-layout"; tab: TRNAppLayoutExampleTab }
  | { group: "side-panel"; tab: TRNSidePanelExampleTab }
  | { group: "sortable"; tab: TRNSortableExampleTab }
  | { group: "sortable-card"; tab: TRNSortableCardExampleTab }
  | { group: "accordion"; tab: TRNAccordionExampleTab };

type TRNExampleCatalogWindowProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (selection: CatalogSelection) => void;
};

function catalogBadgeLabel(g: ExampleGroup | "all"): string {
  if (g === "all") {
    return "All";
  }
  const m: Record<ExampleGroup, string> = {
    container: "TRNContainer",
    window: "TRNWindow",
    "toolbox-panel": "TRNToolboxPanel",
    card: "TRNCard",
    tabs: "TRNTabs",
    "split-pane": "TRNSplitPane",
    "command-palette": "TRNCommandPalette",
    "data-grid": "TRNDataGrid",
    tree: "TRNTree",
    form: "TRNForm",
    "app-layout": "AppLayout",
    "side-panel": "TRNSidePanel",
    sortable: "TRNSortable",
    "sortable-card": "TRNSortableCard",
    accordion: "TRNAccordion",
  };
  return m[g] ?? g;
}

export function TRNExampleCatalogWindow(props: TRNExampleCatalogWindowProps) {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<"all" | ExampleGroup>("all");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TRN_EXAMPLE_CATALOG_ITEMS.filter((item) => {
      if (groupFilter !== "all" && item.group !== groupFilter) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      const haystack =
        `${item.label} ${item.description} ${item.tags.join(" ")} ${item.group}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [groupFilter, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [groupFilter, query]);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 0);
  }, [props.open]);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        evt.preventDefault();
        props.onClose();
        return;
      }
      if (filteredItems.length === 0) {
        return;
      }
      if (evt.key === "ArrowDown") {
        evt.preventDefault();
        setHighlightedIndex((prev) =>
          prev + 1 >= filteredItems.length ? 0 : prev + 1,
        );
        return;
      }
      if (evt.key === "ArrowUp") {
        evt.preventDefault();
        setHighlightedIndex((prev) =>
          prev - 1 < 0 ? filteredItems.length - 1 : prev - 1,
        );
        return;
      }
      if (evt.key === "Enter") {
        evt.preventDefault();
        const item = filteredItems[highlightedIndex];
        if (item == null) {
          return;
        }
        if (item.group === "container") {
          props.onSelect({
            group: "container",
            tab: item.targetTab as TRNContainerExampleTab,
          });
        } else if (item.group === "card") {
          props.onSelect({
            group: "card",
            tab: item.targetTab as TRNCardExampleTab,
          });
        } else if (item.group === "tabs") {
          props.onSelect({
            group: "tabs",
            tab: item.targetTab as TRNTabsExampleTab,
          });
        } else if (item.group === "split-pane") {
          props.onSelect({
            group: "split-pane",
            tab: item.targetTab as TRNSplitPaneExampleTab,
          });
        } else if (item.group === "command-palette") {
          props.onSelect({
            group: "command-palette",
            tab: item.targetTab as TRNCommandPaletteExampleTab,
          });
        } else if (item.group === "data-grid") {
          props.onSelect({
            group: "data-grid",
            tab: item.targetTab as TRNDataGridExampleTab,
          });
        } else if (item.group === "tree") {
          props.onSelect({
            group: "tree",
            tab: item.targetTab as TRNTreeExampleTab,
          });
        } else if (item.group === "form") {
          props.onSelect({
            group: "form",
            tab: item.targetTab as TRNFormExampleTab,
          });
        } else if (item.group === "app-layout") {
          props.onSelect({
            group: "app-layout",
            tab: item.targetTab as TRNAppLayoutExampleTab,
          });
        } else if (item.group === "side-panel") {
          props.onSelect({
            group: "side-panel",
            tab: item.targetTab as TRNSidePanelExampleTab,
          });
        } else if (item.group === "sortable") {
          props.onSelect({
            group: "sortable",
            tab: item.targetTab as TRNSortableExampleTab,
          });
        } else if (item.group === "sortable-card") {
          props.onSelect({
            group: "sortable-card",
            tab: item.targetTab as TRNSortableCardExampleTab,
          });
        } else if (item.group === "accordion") {
          props.onSelect({
            group: "accordion",
            tab: item.targetTab as TRNAccordionExampleTab,
          });
        } else if (item.group === "window") {
          props.onSelect({
            group: "window",
            tab: item.targetTab as TRNWindowExampleTab,
          });
        } else if (item.group === "toolbox-panel") {
          props.onSelect({
            group: "toolbox-panel",
            tab: item.targetTab as TRNToolboxPanelExampleTab,
          });
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredItems, highlightedIndex, props]);

  return (
    <TRNWindow
      open={props.open}
      onClose={props.onClose}
      title="Example Catalog (Ctrl/Cmd+K)"
      modal
      draggable
      resizable
      initialRect={{ x: 140, y: 92, width: 860, height: 620 }}
      minWidth={620}
      minHeight={420}
      contentClassName="space-y-3"
    >
      <TRNTabs
        value={groupFilter}
        onValueChange={(next) => setGroupFilter(next as "all" | ExampleGroup)}
        activeTriggerClassName="border-x-transparent border-t-transparent border-b-2 border-b-cyan-400 text-cyan-300 bg-transparent shadow-none rounded-none"
      >
        <TRNTabsList className="flex flex-wrap">
          {(
            [
              "all",
              "container",
              "window",
              "toolbox-panel",
              "card",
              "tabs",
              "split-pane",
              "command-palette",
              "data-grid",
              "tree",
              "form",
              "app-layout",
              "side-panel",
              "sortable",
              "sortable-card",
              "accordion",
            ] as const
          ).map((group) => (
            <TRNTabsTrigger key={group} value={group} className="rounded-none">
              {group === "all" ? "All" : catalogBadgeLabel(group)}
            </TRNTabsTrigger>
          ))}
        </TRNTabsList>
      </TRNTabs>

      <label className="flex items-center gap-2 border border-zinc-700/80 rounded-md px-2 py-1.5 bg-zinc-900/80">
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={(evt) => setQuery(evt.target.value)}
          placeholder="Search examples..."
          className="w-full bg-transparent text-xs outline-none placeholder:text-zinc-400"
        />
      </label>

      <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 divide-y divide-zinc-700/80">
        {filteredItems.length === 0 ? (
          <div className="px-3 py-8 text-xs text-center text-zinc-400">
            No examples matched your search.
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                "w-full text-left px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 " +
                (filteredItems[highlightedIndex]?.id === item.id
                  ? "bg-cyan-500/10"
                  : "hover:bg-zinc-800/70")
              }
              onMouseEnter={() => {
                const idx = filteredItems.findIndex(
                  (entry) => entry.id === item.id,
                );
                if (idx >= 0) {
                  setHighlightedIndex(idx);
                }
              }}
              onClick={() => {
                if (item.group === "container") {
                  props.onSelect({
                    group: "container",
                    tab: item.targetTab as TRNContainerExampleTab,
                  });
                } else if (item.group === "card") {
                  props.onSelect({
                    group: "card",
                    tab: item.targetTab as TRNCardExampleTab,
                  });
                } else if (item.group === "tabs") {
                  props.onSelect({
                    group: "tabs",
                    tab: item.targetTab as TRNTabsExampleTab,
                  });
                } else if (item.group === "split-pane") {
                  props.onSelect({
                    group: "split-pane",
                    tab: item.targetTab as TRNSplitPaneExampleTab,
                  });
                } else if (item.group === "command-palette") {
                  props.onSelect({
                    group: "command-palette",
                    tab: item.targetTab as TRNCommandPaletteExampleTab,
                  });
                } else if (item.group === "data-grid") {
                  props.onSelect({
                    group: "data-grid",
                    tab: item.targetTab as TRNDataGridExampleTab,
                  });
                } else if (item.group === "tree") {
                  props.onSelect({
                    group: "tree",
                    tab: item.targetTab as TRNTreeExampleTab,
                  });
                } else if (item.group === "form") {
                  props.onSelect({
                    group: "form",
                    tab: item.targetTab as TRNFormExampleTab,
                  });
                } else if (item.group === "app-layout") {
                  props.onSelect({
                    group: "app-layout",
                    tab: item.targetTab as TRNAppLayoutExampleTab,
                  });
                } else if (item.group === "side-panel") {
                  props.onSelect({
                    group: "side-panel",
                    tab: item.targetTab as TRNSidePanelExampleTab,
                  });
                } else if (item.group === "sortable") {
                  props.onSelect({
                    group: "sortable",
                    tab: item.targetTab as TRNSortableExampleTab,
                  });
                } else if (item.group === "sortable-card") {
                  props.onSelect({
                    group: "sortable-card",
                    tab: item.targetTab as TRNSortableCardExampleTab,
                  });
                } else if (item.group === "accordion") {
                  props.onSelect({
                    group: "accordion",
                    tab: item.targetTab as TRNAccordionExampleTab,
                  });
                } else if (item.group === "window") {
                  props.onSelect({
                    group: "window",
                    tab: item.targetTab as TRNWindowExampleTab,
                  });
                } else if (item.group === "toolbox-panel") {
                  props.onSelect({
                    group: "toolbox-panel",
                    tab: item.targetTab as TRNToolboxPanelExampleTab,
                  });
                }
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold">{item.label}</div>
                <span className="text-[10px] rounded border border-zinc-700/80 px-1.5 py-0.5 text-zinc-400">
                  {catalogBadgeLabel(item.group)}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-zinc-400">
                {item.description}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="text-[11px] text-zinc-400">
        {filteredItems.length} result(s). Use ↑/↓ to move, Enter to open, Esc to
        close.
      </div>
    </TRNWindow>
  );
}
