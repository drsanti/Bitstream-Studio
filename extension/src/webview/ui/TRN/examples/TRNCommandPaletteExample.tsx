import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TRN_COMMAND_PALETTE_EXAMPLE_TABS,
  type TRNCommandPaletteExampleTab,
} from "./exampleRegistry.js";
import { TRNCommandPalette, type TRNCommandPaletteItem } from "../TRNCommandPalette.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";

const BASE_ITEMS: TRNCommandPaletteItem[] = [
  { id: "open-settings", label: "Open settings", group: "General" },
  { id: "toggle-theme", label: "Toggle theme", group: "General" },
  { id: "run-ping", label: "Run ping", group: "Diagnostics" },
  { id: "clear-logs", label: "Clear logs", group: "Diagnostics" },
];

const GROUPED_ITEMS: TRNCommandPaletteItem[] = [
  { id: "a1", label: "Connect serial", group: "Connection" },
  { id: "a2", label: "Disconnect", group: "Connection" },
  { id: "b1", label: "Open TRN examples", group: "UI" },
  { id: "b2", label: "Show capabilities", group: "UI" },
];

const SHORTCUT_ITEMS: TRNCommandPaletteItem[] = [
  { id: "k1", label: "Command palette (demo)", shortcut: "⌘K" },
  { id: "k2", label: "Search", shortcut: "⌘F" },
  { id: "k3", label: "Save", shortcut: "⌘S" },
];

type TRNCommandPaletteExampleProps = {
  activeTab?: TRNCommandPaletteExampleTab;
  onActiveTabChange?: (tab: TRNCommandPaletteExampleTab) => void;
};

export function TRNCommandPaletteExample(props: TRNCommandPaletteExampleProps) {
  const [localActiveTab, setLocalActiveTab] =
    useState<TRNCommandPaletteExampleTab>("basic");
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string>("—");
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNCommandPaletteExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  const itemsForTab = (): TRNCommandPaletteItem[] => {
    if (activeTab === "grouped") {
      return GROUPED_ITEMS;
    }
    if (activeTab === "shortcuts") {
      return SHORTCUT_ITEMS;
    }
    return BASE_ITEMS;
  };

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs
        value={activeTab}
        onValueChange={(n) => setActiveTab(n as TRNCommandPaletteExampleTab)}
      >
        <TRNTabsList className="flex flex-wrap">
          {TRN_COMMAND_PALETTE_EXAMPLE_TABS.map((tab) => (
            <TRNTabsTrigger key={tab.id} value={tab.id} className="rounded-none">
              {tab.label}
            </TRNTabsTrigger>
          ))}
        </TRNTabsList>
      </TRNTabs>

      <p className="text-[11px] text-zinc-400">
        Last run: <span className="text-zinc-100 font-mono">{last}</span>
      </p>
      <button
        type="button"
        className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
        onClick={() => setOpen(true)}
      >
        Open palette
      </button>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="text-xs text-zinc-400"
        >
          Use search to filter. Keyboard: ↑/↓, Enter, Esc.
        </motion.div>
      </AnimatePresence>

      <TRNCommandPalette
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(id) => setLast(id)}
        items={itemsForTab()}
        title="TRN command palette (demo)"
      />
    </div>
  );
}
