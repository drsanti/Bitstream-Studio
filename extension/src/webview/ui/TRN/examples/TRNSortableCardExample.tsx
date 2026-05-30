import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layers, LayoutPanelLeft, WandSparkles } from "lucide-react";
import { TRNSortableCard } from "../TRNSortableCard.js";
import { TRNSortableContainer } from "../TRNSortableContainer.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_SORTABLE_CARD_EXAMPLE_TABS,
  type TRNSortableCardExampleTab,
} from "./exampleRegistry.js";

type DemoItem = {
  id: string;
  title: string;
  detail: string;
};

const SEED_ITEMS: DemoItem[] = [
  { id: "a", title: "Panel A", detail: "Card with drag handle + tilt" },
  { id: "b", title: "Panel B", detail: "Card with drag handle + tilt" },
  { id: "c", title: "Panel C", detail: "Card with drag handle + tilt" },
  { id: "d", title: "Panel D", detail: "Card with drag handle + tilt" },
];

type TRNSortableCardExampleProps = {
  activeTab?: TRNSortableCardExampleTab;
  onActiveTabChange?: (tab: TRNSortableCardExampleTab) => void;
};

export function TRNSortableCardExample(props: TRNSortableCardExampleProps) {
  const [localActiveTab, setLocalActiveTab] =
    useState<TRNSortableCardExampleTab>("basic");
  const [items, setItems] = useState<DemoItem[]>(SEED_ITEMS);
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNSortableCardExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const onReorder = (nextIds: string[]) => {
    setItems(nextIds.map((id) => byId.get(id)).filter((v): v is DemoItem => v != null));
  };

  const layoutClass =
    activeTab === "sidebar"
      ? "flex flex-col gap-2 max-w-sm"
      : activeTab === "playful"
        ? "grid grid-cols-1 md:grid-cols-2 gap-2"
        : "flex flex-col gap-2";

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as TRNSortableCardExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_SORTABLE_CARD_EXAMPLE_TABS.map((tab) => (
            <TRNTabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TRNTabsTrigger>
          ))}
        </TRNTabsList>
      </TRNTabs>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
          onClick={() => setItems(SEED_ITEMS)}
        >
          Reset order
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="space-y-2"
        >
          <div className="text-xs text-zinc-400">
            Dedicated `TRNSortableCard` examples. Drag cards by handle to reorder.
            {activeTab === "collapsible"
              ? " This tab demonstrates mixed collapsible=true/false cards."
              : activeTab === "custom-slot"
                ? " This tab demonstrates customRightSlot with right-side metadata."
                : activeTab === "sortable-disabled"
                  ? " This tab demonstrates sortableDisabled (drag disabled)."
              : ""}
          </div>
          <TRNSortableContainer
            itemIds={itemIds}
            onReorder={onReorder}
            layout={activeTab === "playful" ? "grid" : "vertical"}
            className={layoutClass}
          >
            {itemIds.map((id) => {
              const item = byId.get(id);
              if (item == null) {
                return null;
              }
              return (
                <TRNSortableCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  mode={
                    activeTab === "collapsible" || activeTab === "basic"
                      ? "animated"
                      : "simple"
                  }
                  collapsible={
                    activeTab === "collapsible" ? item.id === "a" || item.id === "c" : true
                  }
                  defaultExpanded={activeTab === "collapsible" ? item.id !== "c" : true}
                  icon={
                    activeTab === "sidebar" ? (
                      <LayoutPanelLeft className="h-4 w-4" />
                    ) : activeTab === "playful" ? (
                      <WandSparkles className="h-4 w-4" />
                    ) : activeTab === "collapsible" ? (
                      <Layers className="h-4 w-4" />
                    ) : (
                      <Layers className="h-4 w-4" />
                    )
                  }
                  handlePosition={
                    activeTab === "no-handle"
                      ? "none"
                      : activeTab === "sidebar"
                        ? "right"
                        : "left"
                  }
                  customRightSlot={
                    activeTab === "custom-slot" ? (
                      <span className="inline-flex w-fit text-[10px] text-zinc-400 rounded border border-zinc-700/80 px-1.5 py-0.5 whitespace-nowrap">
                        meta-{item.id}
                      </span>
                    ) : null
                  }
                  sortableDisabled={activeTab === "sortable-disabled"}
                  dragFx={
                    activeTab === "playful"
                      ? "playful"
                      : activeTab === "sidebar"
                        ? "lift"
                        : "tilt"
                  }
                >
                  <div className="text-xs text-zinc-400">{item.detail}</div>
                </TRNSortableCard>
              );
            })}
          </TRNSortableContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
