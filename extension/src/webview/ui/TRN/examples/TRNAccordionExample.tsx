import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TRN_ACCORDION_EXAMPLE_TABS,
  type TRNAccordionExampleTab,
} from "./exampleRegistry.js";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
} from "../TRNAccordion.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";

type TRNAccordionExampleProps = {
  activeTab?: TRNAccordionExampleTab;
  onActiveTabChange?: (tab: TRNAccordionExampleTab) => void;
};

export function TRNAccordionExample(props: TRNAccordionExampleProps) {
  const [localActiveTab, setLocalActiveTab] =
    useState<TRNAccordionExampleTab>("single");
  const [controlledValue, setControlledValue] = useState<string | undefined>("item-1");
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNAccordionExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as TRNAccordionExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_ACCORDION_EXAMPLE_TABS.map((tab) => (
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
          {activeTab === "single" ? (
            <TRNAccordion type="single" defaultValue="item-1">
              <TRNAccordionItem value="item-1">
                <TRNAccordionTrigger>Single mode: Section A</TRNAccordionTrigger>
                <TRNAccordionContent>
                  Only one item stays open at a time.
                </TRNAccordionContent>
              </TRNAccordionItem>
              <TRNAccordionItem value="item-2">
                <TRNAccordionTrigger>Single mode: Section B</TRNAccordionTrigger>
                <TRNAccordionContent>
                  Opening this closes Section A automatically.
                </TRNAccordionContent>
              </TRNAccordionItem>
            </TRNAccordion>
          ) : null}

          {activeTab === "multiple" ? (
            <TRNAccordion type="multiple" defaultValue={["item-1", "item-3"]}>
              <TRNAccordionItem value="item-1">
                <TRNAccordionTrigger>Multiple mode: CPU</TRNAccordionTrigger>
                <TRNAccordionContent>CPU detail panel.</TRNAccordionContent>
              </TRNAccordionItem>
              <TRNAccordionItem value="item-2">
                <TRNAccordionTrigger>Multiple mode: Memory</TRNAccordionTrigger>
                <TRNAccordionContent>Memory detail panel.</TRNAccordionContent>
              </TRNAccordionItem>
              <TRNAccordionItem value="item-3">
                <TRNAccordionTrigger>Multiple mode: Network</TRNAccordionTrigger>
                <TRNAccordionContent>Network detail panel.</TRNAccordionContent>
              </TRNAccordionItem>
            </TRNAccordion>
          ) : null}

          {activeTab === "controlled" ? (
            <div className="space-y-2">
              <button
                type="button"
                className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                onClick={() =>
                  setControlledValue((prev) => (prev === "item-1" ? "item-2" : "item-1"))
                }
              >
                Toggle controlled value
              </button>
              <TRNAccordion
                type="single"
                value={controlledValue}
                onValueChange={(next) =>
                  setControlledValue(typeof next === "string" ? next : undefined)
                }
              >
                <TRNAccordionItem value="item-1">
                  <TRNAccordionTrigger>Controlled A</TRNAccordionTrigger>
                  <TRNAccordionContent>
                    Parent owns current value state.
                  </TRNAccordionContent>
                </TRNAccordionItem>
                <TRNAccordionItem value="item-2">
                  <TRNAccordionTrigger>Controlled B</TRNAccordionTrigger>
                  <TRNAccordionContent>
                    Use value + onValueChange for strict state control.
                  </TRNAccordionContent>
                </TRNAccordionItem>
              </TRNAccordion>
            </div>
          ) : null}

          {activeTab === "disabled" ? (
            <TRNAccordion type="single" defaultValue="item-1">
              <TRNAccordionItem value="item-1">
                <TRNAccordionTrigger>Enabled section</TRNAccordionTrigger>
                <TRNAccordionContent>This section is interactive.</TRNAccordionContent>
              </TRNAccordionItem>
              <TRNAccordionItem value="item-2" disabled>
                <TRNAccordionTrigger>Disabled section</TRNAccordionTrigger>
                <TRNAccordionContent>
                  Disabled item should not open.
                </TRNAccordionContent>
              </TRNAccordionItem>
            </TRNAccordion>
          ) : null}

          {activeTab === "animation" ? (
            <TRNAccordion
              type="multiple"
              defaultValue={["item-1"]}
              durationMs={420}
              easing="cubic-bezier(0.16, 1, 0.3, 1)"
              animateOpacity={false}
            >
              <TRNAccordionItem value="item-1">
                <TRNAccordionTrigger>Animation tuned A</TRNAccordionTrigger>
                <TRNAccordionContent>
                  Custom duration/easing without opacity fade.
                </TRNAccordionContent>
              </TRNAccordionItem>
              <TRNAccordionItem value="item-2">
                <TRNAccordionTrigger>Animation tuned B</TRNAccordionTrigger>
                <TRNAccordionContent>
                  Keeps the same motion profile as tuned item A.
                </TRNAccordionContent>
              </TRNAccordionItem>
            </TRNAccordion>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
