import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TRN_TREE_EXAMPLE_TABS,
  type TRNTreeExampleTab,
} from "./exampleRegistry.js";
import { TRNTree, type TRNTreeNode } from "../TRNTree.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";

const NESTED: TRNTreeNode[] = [
  {
    id: "root",
    label: "Device",
    children: [
      {
        id: "cm55",
        label: "CM55",
        children: [
          { id: "diag", label: "Diagnostics" },
          { id: "sens", label: "Sensors" },
        ],
      },
      { id: "cm33", label: "CM33", children: [{ id: "ble", label: "BLE" }] },
    ],
  },
];

const FLAT: TRNTreeNode[] = [
  { id: "a", label: "Item A" },
  { id: "b", label: "Item B" },
  { id: "c", label: "Item C" },
];

type TRNTreeExampleProps = {
  activeTab?: TRNTreeExampleTab;
  onActiveTabChange?: (tab: TRNTreeExampleTab) => void;
};

export function TRNTreeExample(props: TRNTreeExampleProps) {
  const [localActiveTab, setLocalActiveTab] = useState<TRNTreeExampleTab>("basic");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(["root", "cm55"]),
  );
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNTreeExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs
        value={activeTab}
        onValueChange={(n) => setActiveTab(n as TRNTreeExampleTab)}
      >
        <TRNTabsList className="flex flex-wrap">
          {TRN_TREE_EXAMPLE_TABS.map((tab) => (
            <TRNTabsTrigger key={tab.id} value={tab.id} className="rounded-none">
              {tab.label}
            </TRNTabsTrigger>
          ))}
        </TRNTabsList>
      </TRNTabs>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {activeTab === "basic" ? (
            <TRNTree data={FLAT} defaultExpanded={[]} />
          ) : null}
          {activeTab === "nested" ? (
            <TRNTree data={NESTED} defaultExpanded={["root", "cm55"]} />
          ) : null}
          {activeTab === "controlled" ? (
            <div className="space-y-2">
              <p className="text-[11px] text-zinc-400">
                Expanded: {Array.from(expanded).join(", ") || "—"}
              </p>
              <TRNTree
                data={NESTED}
                expanded={expanded}
                onExpandedChange={setExpanded}
              />
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
