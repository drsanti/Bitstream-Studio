import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Grid3X3, List, Rows3 } from "lucide-react";
import { TRNCard } from "../TRNCard.js";
import { TRNDragHandle } from "../TRNDragHandle.js";
import { TRNSortableContainer } from "../TRNSortableContainer.js";
import { TRNSortableItem } from "../TRNSortableItem.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_SORTABLE_EXAMPLE_TABS,
  type TRNSortableExampleTab,
} from "./exampleRegistry.js";

type TRNSortableExampleProps = {
  activeTab?: TRNSortableExampleTab;
  onActiveTabChange?: (tab: TRNSortableExampleTab) => void;
};

type DemoItem = {
  id: string;
  title: string;
  value: string;
};

const INITIAL_ITEMS: DemoItem[] = [
  { id: "cpu", title: "CPU", value: "43%" },
  { id: "memory", title: "Memory", value: "68%" },
  { id: "network", title: "Network", value: "120 Mbps" },
  { id: "storage", title: "Storage", value: "71%" },
];

export function TRNSortableExample(props: TRNSortableExampleProps) {
  const [localActiveTab, setLocalActiveTab] =
    useState<TRNSortableExampleTab>("vertical");
  const [items, setItems] = useState<DemoItem[]>(INITIAL_ITEMS);
  const [useAutoDragFx, setUseAutoDragFx] = useState(true);
  const [dragFx, setDragFx] = useState<"none" | "lift" | "tilt" | "playful">(
    "tilt",
  );
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNSortableExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const reorderByIds = (nextIds: string[]) => {
    setItems(
      nextIds
        .map((id) => itemById.get(id))
        .filter((item): item is DemoItem => item != null),
    );
  };

  const layoutClass =
    activeTab === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 gap-2"
      : activeTab === "horizontal"
        ? "flex flex-row gap-2 overflow-x-auto"
        : "flex flex-col gap-2";
  const autoDragFx = activeTab === "grid" ? "lift" : "tilt";
  const effectiveDragFx = useAutoDragFx ? autoDragFx : dragFx;

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as TRNSortableExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_SORTABLE_EXAMPLE_TABS.map((tab) => (
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
          onClick={() => setItems(INITIAL_ITEMS)}
        >
          Reset order
        </button>
        {(["none", "lift", "tilt", "playful"] as const).map((fx) => (
          <button
            key={fx}
            type="button"
            className={
              "px-2 py-1 text-xs rounded border " +
              (!useAutoDragFx && dragFx === fx
                ? "border-cyan-500/50 text-cyan-300 bg-cyan-500/10"
                : "border-zinc-700/80 hover:bg-zinc-800/70")
            }
            onClick={() => {
              setUseAutoDragFx(false);
              setDragFx(fx);
            }}
          >
            fx: {fx}
          </button>
        ))}
        <button
          type="button"
          className={
            "px-2 py-1 text-xs rounded border " +
            (useAutoDragFx
              ? "border-cyan-500/50 text-cyan-300 bg-cyan-500/10"
              : "border-zinc-700/80 hover:bg-zinc-800/70")
          }
          onClick={() => setUseAutoDragFx(true)}
        >
          fx: auto ({autoDragFx})
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
            Drag by handle to reorder. Layout mode:
            {" "}
            {activeTab === "vertical"
              ? "vertical list"
              : activeTab === "horizontal"
                ? "horizontal row"
                : "grid"}
            . Drag effect preset: {useAutoDragFx ? `auto (${autoDragFx})` : effectiveDragFx}.
          </div>
          <TRNSortableContainer
            itemIds={itemIds}
            onReorder={reorderByIds}
            layout={activeTab}
            className={layoutClass}
          >
            {itemIds.map((id) => {
              const item = itemById.get(id);
              if (item == null) {
                return null;
              }
              return (
                <TRNSortableItem
                  key={item.id}
                  id={item.id}
                  dragFx={effectiveDragFx}
                  className={activeTab === "horizontal" ? "min-w-[220px]" : ""}
                >
                  <TRNCard
                    title={item.title}
                    icon={
                      activeTab === "grid" ? (
                        <Grid3X3 className="h-4 w-4" />
                      ) : activeTab === "horizontal" ? (
                        <Rows3 className="h-4 w-4" />
                      ) : (
                        <List className="h-4 w-4" />
                      )
                    }
                    mode="simple"
                    collapsible={false}
                    rightSlot={<TRNDragHandle />}
                  >
                    <div className="text-xs text-zinc-400">
                      Current value:
                      {" "}
                      <span className="font-semibold text-zinc-100">
                        {item.value}
                      </span>
                    </div>
                  </TRNCard>
                </TRNSortableItem>
              );
            })}
          </TRNSortableContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
