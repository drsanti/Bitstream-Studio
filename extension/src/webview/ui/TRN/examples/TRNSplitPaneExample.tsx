import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TRN_SPLIT_PANE_EXAMPLE_TABS,
  type TRNSplitPaneExampleTab,
} from "./exampleRegistry.js";
import { TRNSplitPane } from "../TRNSplitPane.js";
import { TRNCard } from "../TRNCard.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";

type TRNSplitPaneExampleProps = {
  activeTab?: TRNSplitPaneExampleTab;
  onActiveTabChange?: (tab: TRNSplitPaneExampleTab) => void;
};

function DemoCard(props: { title: string; body: string }) {
  return (
    <TRNCard title={props.title} mode="simple" collapsible={false}>
      <div className="text-xs text-zinc-400">{props.body}</div>
    </TRNCard>
  );
}

export function TRNSplitPaneExample(props: TRNSplitPaneExampleProps) {
  const [localActiveTab, setLocalActiveTab] =
    useState<TRNSplitPaneExampleTab>("horizontal");
  const [controlledSize, setControlledSize] = useState(0.44);
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNSplitPaneExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as TRNSplitPaneExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_SPLIT_PANE_EXAMPLE_TABS.map((tab) => (
            <TRNTabsTrigger key={tab.id} value={tab.id}>
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
          className="space-y-2"
        >
          {activeTab === "horizontal" ? (
            <div className="h-[340px] border border-zinc-700/80 rounded-md p-2">
              <TRNSplitPane
                direction="horizontal"
                defaultSize={0.52}
                primary={
                  <DemoCard
                    title="Left / Primary"
                    body="Drag the center divider horizontally."
                  />
                }
                secondary={
                  <DemoCard
                    title="Right / Secondary"
                    body="Double-click divider to reset default size."
                  />
                }
              />
            </div>
          ) : null}

          {activeTab === "vertical" ? (
            <div className="h-[340px] border border-zinc-700/80 rounded-md p-2">
              <TRNSplitPane
                direction="vertical"
                defaultSize={0.45}
                minPrimaryPx={120}
                minSecondaryPx={120}
                primary={
                  <DemoCard
                    title="Top / Primary"
                    body="Vertical split supports keyboard Arrow Up/Down."
                  />
                }
                secondary={
                  <DemoCard
                    title="Bottom / Secondary"
                    body="Use Shift + Arrow for larger resize steps."
                  />
                }
              />
            </div>
          ) : null}

          {activeTab === "two-cols" ? (
            <div className="h-[340px] border border-zinc-700/80 rounded-md p-2">
              <TRNSplitPane
                direction="horizontal"
                defaultSize={0.5}
                minPrimaryPx={180}
                minSecondaryPx={180}
                primary={
                  <div className="h-full grid grid-cols-1 gap-2">
                    <DemoCard title="Column A / Top" body="Left column section 1." />
                    <DemoCard title="Column A / Bottom" body="Left column section 2." />
                  </div>
                }
                secondary={
                  <div className="h-full grid grid-cols-1 gap-2">
                    <DemoCard title="Column B / Top" body="Right column section 1." />
                    <DemoCard title="Column B / Bottom" body="Right column section 2." />
                  </div>
                }
              />
            </div>
          ) : null}

          {activeTab === "two-rows" ? (
            <div className="h-[340px] border border-zinc-700/80 rounded-md p-2">
              <TRNSplitPane
                direction="vertical"
                defaultSize={0.5}
                minPrimaryPx={120}
                minSecondaryPx={120}
                primary={
                  <div className="h-full grid grid-cols-2 gap-2">
                    <DemoCard title="Row A / Left" body="Top row panel 1." />
                    <DemoCard title="Row A / Right" body="Top row panel 2." />
                  </div>
                }
                secondary={
                  <div className="h-full grid grid-cols-2 gap-2">
                    <DemoCard title="Row B / Left" body="Bottom row panel 1." />
                    <DemoCard title="Row B / Right" body="Bottom row panel 2." />
                  </div>
                }
              />
            </div>
          ) : null}

          {activeTab === "quad-grid" ? (
            <div className="h-[360px] border border-zinc-700/80 rounded-md p-2">
              <TRNSplitPane
                direction="horizontal"
                defaultSize={0.5}
                minPrimaryPx={220}
                minSecondaryPx={220}
                primary={
                  <TRNSplitPane
                    direction="vertical"
                    defaultSize={0.5}
                    minPrimaryPx={120}
                    minSecondaryPx={120}
                    primary={<DemoCard title="Top Left" body="Nested split pane A1." />}
                    secondary={<DemoCard title="Bottom Left" body="Nested split pane A2." />}
                  />
                }
                secondary={
                  <TRNSplitPane
                    direction="vertical"
                    defaultSize={0.5}
                    minPrimaryPx={120}
                    minSecondaryPx={120}
                    primary={<DemoCard title="Top Right" body="Nested split pane B1." />}
                    secondary={<DemoCard title="Bottom Right" body="Nested split pane B2." />}
                  />
                }
              />
            </div>
          ) : null}

          {activeTab === "workbench" ? (
            <div className="h-[380px] border border-zinc-700/80 rounded-md p-2">
              <TRNSplitPane
                direction="horizontal"
                defaultSize={0.24}
                minPrimaryPx={170}
                minSecondaryPx={300}
                primary={
                  <div className="h-full grid grid-cols-1 gap-2">
                    <DemoCard
                      title="Sidebar: Explorer"
                      body="Navigation tree, quick filters, and tool shortcuts."
                    />
                    <DemoCard
                      title="Sidebar: Outline"
                      body="Current view outline and section jump links."
                    />
                  </div>
                }
                secondary={
                  <TRNSplitPane
                    direction="vertical"
                    defaultSize={0.72}
                    minPrimaryPx={180}
                    minSecondaryPx={110}
                    primary={
                      <TRNSplitPane
                        direction="horizontal"
                        defaultSize={0.62}
                        minPrimaryPx={220}
                        minSecondaryPx={160}
                        primary={
                          <DemoCard
                            title="Main: Canvas"
                            body="Primary editing/visual area."
                          />
                        }
                        secondary={
                          <DemoCard
                            title="Main: Inspector"
                            body="Properties panel for selected node or row."
                          />
                        }
                      />
                    }
                    secondary={
                      <DemoCard
                        title="Bottom: Console"
                        body="Logs, events, command output, and diagnostics stream."
                      />
                    }
                  />
                }
              />
            </div>
          ) : null}

          {activeTab === "ide" ? (
            <div className="h-[390px] border border-zinc-700/80 rounded-md p-2">
              <TRNSplitPane
                direction="horizontal"
                defaultSize={0.2}
                minPrimaryPx={160}
                minSecondaryPx={360}
                primary={
                  <DemoCard
                    title="Explorer"
                    body="Files, search, source control, and project navigation."
                  />
                }
                secondary={
                  <TRNSplitPane
                    direction="vertical"
                    defaultSize={0.76}
                    minPrimaryPx={200}
                    minSecondaryPx={120}
                    primary={
                      <TRNSplitPane
                        direction="horizontal"
                        defaultSize={0.72}
                        minPrimaryPx={240}
                        minSecondaryPx={180}
                        primary={
                          <DemoCard
                            title="Editor"
                            body="Main code editor area with tab strip and minimap."
                          />
                        }
                        secondary={
                          <DemoCard
                            title="Outline"
                            body="Symbols, breadcrumbs, and quick navigation."
                          />
                        }
                      />
                    }
                    secondary={
                      <DemoCard
                        title="Terminal"
                        body="Build output, tests, REPL, and command history."
                      />
                    }
                  />
                }
              />
            </div>
          ) : null}

          {activeTab === "monitoring" ? (
            <div className="h-[390px] border border-zinc-700/80 rounded-md p-2">
              <TRNSplitPane
                direction="vertical"
                defaultSize={0.44}
                minPrimaryPx={120}
                minSecondaryPx={180}
                primary={
                  <TRNSplitPane
                    direction="horizontal"
                    defaultSize={0.5}
                    minPrimaryPx={220}
                    minSecondaryPx={220}
                    primary={
                      <TRNSplitPane
                        direction="horizontal"
                        defaultSize={0.5}
                        minPrimaryPx={110}
                        minSecondaryPx={110}
                        primary={<DemoCard title="CPU" body="Realtime CPU load and attribution." />}
                        secondary={<DemoCard title="Memory" body="Heap usage, free blocks, pressure signals." />}
                      />
                    }
                    secondary={
                      <TRNSplitPane
                        direction="horizontal"
                        defaultSize={0.5}
                        minPrimaryPx={110}
                        minSecondaryPx={110}
                        primary={<DemoCard title="I/O" body="TX/RX throughput and queue depth." />}
                        secondary={<DemoCard title="Network" body="Latency, retries, and connection state." />}
                      />
                    }
                  />
                }
                secondary={
                  <TRNSplitPane
                    direction="horizontal"
                    defaultSize={0.68}
                    minPrimaryPx={260}
                    minSecondaryPx={120}
                    primary={
                      <DemoCard
                        title="Event Timeline"
                        body="Fault and audit sequence for diagnostics and telemetry."
                      />
                    }
                    secondary={
                      <DemoCard
                        title="Log Stream"
                        body="Live console logs with search and severity filters."
                      />
                    }
                  />
                }
              />
            </div>
          ) : null}

          {activeTab === "persist" ? (
            <div className="space-y-2">
              <div className="h-[340px] border border-zinc-700/80 rounded-md p-2">
                <TRNSplitPane
                  direction="horizontal"
                  defaultSize={0.5}
                  persistKey="trn-splitpane-example:persist"
                  primary={
                    <DemoCard
                      title="Persisted primary"
                      body="Resize and reopen this example; size is restored from localStorage."
                    />
                  }
                  secondary={
                    <DemoCard
                      title="Persisted secondary"
                      body="Double-click the divider to return to default 50/50."
                    />
                  }
                />
              </div>
            </div>
          ) : null}

          {activeTab === "controlled" ? (
            <div className="space-y-2">
              <div className="text-[11px] text-zinc-400">
                Controlled ratio:{" "}
                <span className="text-zinc-100">{controlledSize.toFixed(2)}</span>
              </div>
              <div className="h-[340px] border border-zinc-700/80 rounded-md p-2">
                <TRNSplitPane
                  direction="horizontal"
                  size={controlledSize}
                  onSizeChange={setControlledSize}
                  primary={
                    <DemoCard
                      title="Controlled primary"
                      body="Size is controlled by parent state."
                    />
                  }
                  secondary={
                    <DemoCard
                      title="Controlled secondary"
                      body="Use parent buttons to programmatically change width."
                    />
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setControlledSize(0.35)}
                >
                  35%
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setControlledSize(0.5)}
                >
                  50%
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setControlledSize(0.65)}
                >
                  65%
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
