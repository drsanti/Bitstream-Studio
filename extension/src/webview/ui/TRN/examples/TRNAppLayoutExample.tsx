import { useState } from "react";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_APP_LAYOUT_EXAMPLE_TABS,
  type TRNAppLayoutExampleTab,
} from "./exampleRegistry.js";
import { AppLayoutExamples } from "./app-layout/AppLayoutExamples.js";

type TRNAppLayoutExampleProps = {
  activeTab?: TRNAppLayoutExampleTab;
  onActiveTabChange?: (tab: TRNAppLayoutExampleTab) => void;
};

function placeholderContent(tab: TRNAppLayoutExampleTab) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-zinc-400">
        Placeholder payload for: <span className="text-zinc-100">{tab}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="h-20 rounded border border-zinc-700/80 bg-zinc-800/70"
          />
        ))}
      </div>
    </div>
  );
}

export function TRNAppLayoutExample(props: TRNAppLayoutExampleProps) {
  const [localActiveTab, setLocalActiveTab] = useState<TRNAppLayoutExampleTab>("stack-default");
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: TRNAppLayoutExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="h-full min-h-0 border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as TRNAppLayoutExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_APP_LAYOUT_EXAMPLE_TABS.map((tab) => (
            <TRNTabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TRNTabsTrigger>
          ))}
        </TRNTabsList>
      </TRNTabs>

      <div className="h-[640px] min-h-0 overflow-hidden border border-zinc-700/80 rounded-md p-2">
        <AppLayoutExamples content={placeholderContent(activeTab)} defaultLayout={activeTab} />
      </div>
    </div>
  );
}
