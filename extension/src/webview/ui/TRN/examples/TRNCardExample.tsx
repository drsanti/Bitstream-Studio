import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gauge, PanelTopOpen, SlidersHorizontal } from "lucide-react";
import { TRNCard } from "../TRNCard.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_CARD_EXAMPLE_TABS,
  type TRNCardExampleTab,
} from "./exampleRegistry.js";

type TRNCardExampleProps = {
  activeTab?: TRNCardExampleTab;
  onActiveTabChange?: (tab: TRNCardExampleTab) => void;
};

export function TRNCardExample(props: TRNCardExampleProps) {
  const [localActiveTab, setLocalActiveTab] = useState<TRNCardExampleTab>("simple");
  const [controlledExpanded, setControlledExpanded] = useState(true);
  const [headerClickExpanded, setHeaderClickExpanded] = useState(true);
  const [collapsedHeightExpanded, setCollapsedHeightExpanded] = useState(true);
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNCardExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as TRNCardExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_CARD_EXAMPLE_TABS.map((tab) => (
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
          className="space-y-3"
        >
          {activeTab === "simple" ? (
            <TRNCard
              title="Simple mode card"
              icon={<PanelTopOpen className="h-4 w-4" />}
              mode="simple"
            >
              <div className="text-xs text-zinc-400">
                This is the lightweight show/hide mode. No measured height animation.
              </div>
            </TRNCard>
          ) : null}

          {activeTab === "animated" ? (
            <TRNCard
              title="Animated mode card"
              icon={<Gauge className="h-4 w-4" />}
              mode="animated"
              durationMs={260}
              animateOpacity
            >
              <div className="space-y-2 text-xs">
                <div className="font-semibold">Measured height animation</div>
                <div className="text-zinc-400">
                  Card body uses max-height transition with live content measurement.
                </div>
                <ul className="list-disc pl-4 text-zinc-400 space-y-1">
                  <li>durationMs: 260</li>
                  <li>easing: default cubic-bezier</li>
                  <li>animateOpacity: true</li>
                </ul>
              </div>
            </TRNCard>
          ) : null}

          {activeTab === "controlled" ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setControlledExpanded((prev) => !prev)}
                >
                  Toggle from parent
                </button>
              </div>
              <TRNCard
                title="Controlled expanded state"
                icon={<SlidersHorizontal className="h-4 w-4" />}
                mode="animated"
                expanded={controlledExpanded}
                onExpandedChange={setControlledExpanded}
              >
                <div className="text-xs text-zinc-400">
                  Parent controls expanded state via `expanded` + `onExpandedChange`.
                </div>
              </TRNCard>
            </div>
          ) : null}

          {activeTab === "toggle-header" ? (
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                Header click is disabled (`toggleOnHeaderClick=false`), so only Chevron toggles.
              </div>
              <TRNCard
                title="Toggle only via Chevron"
                icon={<SlidersHorizontal className="h-4 w-4" />}
                mode="animated"
                expanded={headerClickExpanded}
                onExpandedChange={setHeaderClickExpanded}
                toggleOnHeaderClick={false}
              >
                <div className="text-xs text-zinc-400">
                  Clicking title row does not collapse/expand this card.
                </div>
              </TRNCard>
            </div>
          ) : null}

          {activeTab === "disabled" ? (
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                Disabled cards cannot be toggled from header or Chevron.
              </div>
              <TRNCard
                title="Disabled card"
                icon={<PanelTopOpen className="h-4 w-4" />}
                mode="animated"
                disabled
                defaultExpanded
              >
                <div className="text-xs text-zinc-400">
                  Disabled state is useful for locked or pending sections.
                </div>
              </TRNCard>
            </div>
          ) : null}

          {activeTab === "collapsed-height" ? (
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                This card uses custom `collapsedHeight`, `durationMs`, `easing`, and
                `animateOpacity=false`.
              </div>
              <TRNCard
                title="Custom collapsed baseline"
                icon={<Gauge className="h-4 w-4" />}
                mode="animated"
                expanded={collapsedHeightExpanded}
                onExpandedChange={setCollapsedHeightExpanded}
                collapsedHeight={28}
                durationMs={420}
                easing="cubic-bezier(0.16, 1, 0.3, 1)"
                animateOpacity={false}
              >
                <div className="space-y-1 text-xs">
                  <div className="text-zinc-400">
                    Body keeps a small collapsed preview area (28px).
                  </div>
                  <div className="text-zinc-400">
                    Transition is slower with a different easing curve.
                  </div>
                </div>
              </TRNCard>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
