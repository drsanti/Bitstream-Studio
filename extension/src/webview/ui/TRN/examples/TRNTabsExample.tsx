import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TRN_TABS_EXAMPLE_TABS,
  type TRNTabsExampleTab,
} from "./exampleRegistry.js";
import {
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
} from "../TRNTabs.js";

type TRNTabsExampleProps = {
  activeTab?: TRNTabsExampleTab;
  onActiveTabChange?: (tab: TRNTabsExampleTab) => void;
};

export function TRNTabsExample(props: TRNTabsExampleProps) {
  const [localActiveTab, setLocalActiveTab] = useState<TRNTabsExampleTab>("basic");
  const [controlledValue, setControlledValue] = useState("overview");
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNTabsExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as TRNTabsExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_TABS_EXAMPLE_TABS.map((tab) => (
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
          {activeTab === "basic" ? (
            <TRNTabs defaultValue="overview">
              <TRNTabsList>
                <TRNTabsTrigger value="overview">Overview</TRNTabsTrigger>
                <TRNTabsTrigger value="runtime">Runtime</TRNTabsTrigger>
                <TRNTabsTrigger value="events">Events</TRNTabsTrigger>
              </TRNTabsList>
              <TRNTabsContent value="overview" className="text-xs text-zinc-400">
                Overview panel content.
              </TRNTabsContent>
              <TRNTabsContent value="runtime" className="text-xs text-zinc-400">
                Runtime panel content.
              </TRNTabsContent>
              <TRNTabsContent value="events" className="text-xs text-zinc-400">
                Events panel content.
              </TRNTabsContent>
            </TRNTabs>
          ) : null}

          {activeTab === "controlled" ? (
            <TRNTabs
              value={controlledValue}
              onValueChange={setControlledValue}
              lazyMount
            >
              <TRNTabsList>
                <TRNTabsTrigger value="overview">Overview</TRNTabsTrigger>
                <TRNTabsTrigger value="controls">Controls</TRNTabsTrigger>
                <TRNTabsTrigger value="metrics">Metrics</TRNTabsTrigger>
              </TRNTabsList>
              <div className="text-[11px] text-zinc-400">
                Active tab: <span className="text-zinc-100">{controlledValue}</span>
              </div>
              <TRNTabsContent value="overview" className="text-xs text-zinc-400">
                Controlled state keeps selected tab in parent.
              </TRNTabsContent>
              <TRNTabsContent value="controls" className="text-xs text-zinc-400">
                `lazyMount` mounts tab content only when opened at least once.
              </TRNTabsContent>
              <TRNTabsContent value="metrics" className="text-xs text-zinc-400">
                You can sync this value to URL or store state.
              </TRNTabsContent>
            </TRNTabs>
          ) : null}

          {activeTab === "vertical" ? (
            <TRNTabs defaultValue="diagnostics" orientation="vertical" className="flex gap-3">
              <TRNTabsList className="min-w-[180px]">
                <TRNTabsTrigger value="diagnostics">Diagnostics</TRNTabsTrigger>
                <TRNTabsTrigger value="sensors">Sensors</TRNTabsTrigger>
                <TRNTabsTrigger value="io">I/O</TRNTabsTrigger>
              </TRNTabsList>
              <div className="flex-1">
                <TRNTabsContent value="diagnostics" className="text-xs text-zinc-400">
                  Vertical tabs support Arrow Up/Down, Home/End, Enter/Space.
                </TRNTabsContent>
                <TRNTabsContent value="sensors" className="text-xs text-zinc-400">
                  Useful for side-panel style navigation.
                </TRNTabsContent>
                <TRNTabsContent value="io" className="text-xs text-zinc-400">
                  Keep content simple and fast to switch.
                </TRNTabsContent>
              </div>
            </TRNTabs>
          ) : null}

          {activeTab === "rail" ? (
            <div className="grid grid-cols-1 gap-3">
              {(["right", "left"] as const).map((side) => (
                <TRNTabs
                  key={side}
                  defaultValue="tab-2"
                  variant="rail"
                  railSide={side}
                  className={
                    "flex min-h-0 " + (side === "right" ? "flex-row gap-0" : "flex-row-reverse gap-0")
                  }
                >
                  <div
                    className={
                      "min-w-0 flex-1 border border-zinc-700/80 bg-rose-950/35 p-3 text-zinc-100 " +
                      (side === "right" ? "rounded-l-md" : "rounded-r-md")
                    }
                  >
                    <div className="text-sm font-semibold">Tab 2</div>
                    <div className="mt-1 text-xs text-zinc-200/80">
                      Rail tabs support many items (scroll) and left/right docking.
                    </div>
                    <div className="mt-3 text-xs text-zinc-200/70">
                      Active tab uses a stronger highlight. Labels are rotated to match the rail style.
                    </div>
                  </div>

                  <TRNTabsList className={side === "right" ? "-ml-px" : "-mr-px"}>
                    {Array.from({ length: 18 }, (_, i) => {
                      const value = `tab-${i + 1}`;
                      return (
                        <TRNTabsTrigger key={value} value={value}>
                          Tab {i + 1}
                        </TRNTabsTrigger>
                      );
                    })}
                  </TRNTabsList>
                </TRNTabs>
              ))}
            </div>
          ) : null}

          {activeTab === "animation" ? (
            <TRNTabs defaultValue="fast">
              <TRNTabsList>
                <TRNTabsTrigger value="fast">Fast</TRNTabsTrigger>
                <TRNTabsTrigger value="smooth">Smooth</TRNTabsTrigger>
              </TRNTabsList>
              <TRNTabsContent
                value="fast"
                animated
                durationMs={120}
                easing="linear"
                className="text-xs text-zinc-400"
              >
                Fast transition profile.
              </TRNTabsContent>
              <TRNTabsContent
                value="smooth"
                animated
                durationMs={300}
                easing="cubic-bezier(0.16, 1, 0.3, 1)"
                className="text-xs text-zinc-400"
              >
                Smooth transition profile with easing.
              </TRNTabsContent>
            </TRNTabs>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
