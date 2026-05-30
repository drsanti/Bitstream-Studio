import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TRN_DATA_GRID_EXAMPLE_TABS,
  type TRNDataGridExampleTab,
} from "./exampleRegistry.js";
import { TRNDataGrid, type TRNDataGridColumn } from "../TRNDataGrid.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";

type Row = { id: string; name: string; value: number; state: string };

const SAMPLE: Row[] = [
  { id: "1", name: "Task A", value: 12, state: "run" },
  { id: "2", name: "Task B", value: 44, state: "block" },
  { id: "3", name: "Task C", value: 7, state: "ready" },
];

const COLUMNS: TRNDataGridColumn<Row>[] = [
  { id: "name", label: "Name", width: 120, getValue: (r) => r.name },
  { id: "value", label: "Value", width: 80, align: "end", getValue: (r) => r.value },
  { id: "state", label: "State", width: 100, getValue: (r) => r.state },
];

type TRNDataGridExampleProps = {
  activeTab?: TRNDataGridExampleTab;
  onActiveTabChange?: (tab: TRNDataGridExampleTab) => void;
};

export function TRNDataGridExample(props: TRNDataGridExampleProps) {
  const [localActiveTab, setLocalActiveTab] =
    useState<TRNDataGridExampleTab>("basic");
  const [rows, setRows] = useState(SAMPLE);
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNDataGridExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  const resizable = activeTab === "resize";
  const withSort = activeTab !== "basic";

  const columns = useMemo((): TRNDataGridColumn<Row>[] => {
    if (activeTab === "custom") {
      return [
        { id: "name", label: "Name", width: 140, getValue: (r) => r.name },
        {
          id: "value",
          label: "Value (mono)",
          width: 100,
          getValue: (r) => r.value,
          cell: (r) => (
            <span className="font-mono text-cyan-300">{r.value}</span>
          ),
        },
        { id: "state", label: "State", width: 80, getValue: (r) => r.state },
      ];
    }
    return COLUMNS;
  }, [activeTab]);

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs
        value={activeTab}
        onValueChange={(n) => setActiveTab(n as TRNDataGridExampleTab)}
      >
        <TRNTabsList className="flex flex-wrap">
          {TRN_DATA_GRID_EXAMPLE_TABS.map((tab) => (
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
          <p className="text-[11px] text-zinc-400 mb-2">
            {activeTab === "sort"
              ? "Click a column header to cycle sort. Requires getValue on column."
              : resizable
                ? "Drag the right edge of a header to resize (demo)."
                : "Basic read-only table."}
          </p>
          <TRNDataGrid<Row>
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            resizableColumns={resizable}
            defaultSortColumnId={withSort ? "name" : undefined}
            defaultSortDirection={withSort ? "asc" : null}
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 text-[10px]">
        <button
          type="button"
          className="px-2 py-0.5 border border-zinc-700/80 rounded"
          onClick={() => setRows([...SAMPLE])}
        >
          Reset rows
        </button>
      </div>
    </div>
  );
}
