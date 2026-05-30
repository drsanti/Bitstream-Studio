import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TRN_FORM_EXAMPLE_TABS,
  type TRNFormExampleTab,
} from "./exampleRegistry.js";
import { TRNFormField, TRNFormSection, TRNInlineEdit } from "../TRNForm.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";

type TRNFormExampleProps = {
  activeTab?: TRNFormExampleTab;
  onActiveTabChange?: (tab: TRNFormExampleTab) => void;
};

export function TRNFormExample(props: TRNFormExampleProps) {
  const [localActiveTab, setLocalActiveTab] = useState<TRNFormExampleTab>("section");
  const [name, setName] = useState("firmware-01");
  const [validated, setValidated] = useState("42");
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNFormExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3 max-w-md">
      <TRNTabs
        value={activeTab}
        onValueChange={(n) => setActiveTab(n as TRNFormExampleTab)}
      >
        <TRNTabsList className="flex flex-wrap">
          {TRN_FORM_EXAMPLE_TABS.map((tab) => (
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
          className="space-y-3"
        >
          {activeTab === "section" ? (
            <TRNFormSection
              title="Connection"
              description="Target and timing for this session."
            >
              <TRNFormField
                id="f-host"
                label="Host"
                hint="Read-only in demo."
                required
              >
                <input
                  id="f-host"
                  className="w-full rounded border border-zinc-700/80 bg-zinc-900/70 px-2 py-1 text-xs"
                  readOnly
                  value="127.0.0.1"
                />
              </TRNFormField>
              <TRNFormField id="f-port" label="Port" error="Example error text">
                <input
                  id="f-port"
                  className="w-full rounded border border-rose-500/50 bg-zinc-900/70 px-2 py-1 text-xs"
                  defaultValue="0"
                />
              </TRNFormField>
            </TRNFormSection>
          ) : null}

          {activeTab === "inline" ? (
            <TRNFormSection title="Labels" description="Click pencil to edit.">
              <TRNFormField label="Device name" id="f-inline-name">
                <TRNInlineEdit
                  value={name}
                  onCommit={(n) => setName(n)}
                  className="w-full"
                />
              </TRNFormField>
              <TRNFormField label="Notes" id="f-inline-notes">
                <TRNInlineEdit
                  defaultValue="Line one"
                  onCommit={() => {
                    return;
                  }}
                  multiline
                  className="w-full"
                />
              </TRNFormField>
            </TRNFormSection>
          ) : null}

          {activeTab === "validation" ? (
            <TRNFormSection title="Validation" description="Number 1…99.">
              <TRNFormField
                id="f-val"
                label="Stream interval (ms)"
                required
                hint="Inline validate on save."
              >
                <TRNInlineEdit
                  value={validated}
                  onCommit={(n) => setValidated(n)}
                  validate={(s) => {
                    const n = parseInt(s, 10);
                    if (Number.isNaN(n) || s.trim() !== String(n)) {
                      return "Integer required";
                    }
                    if (n < 1 || n > 99) {
                      return "Out of range (1-99)";
                    }
                    return true;
                  }}
                  className="w-full"
                />
              </TRNFormField>
            </TRNFormSection>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
