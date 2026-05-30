import { useRef, useState } from "react";
import { Boxes } from "lucide-react";
import { TRNToolboxPanel } from "../TRNToolboxPanel.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_TOOLBOX_PANEL_EXAMPLE_TABS,
  type TRNToolboxPanelExampleTab,
} from "./exampleRegistry.js";

type ToolboxTab = TRNToolboxPanelExampleTab;

export type TRNToolboxPanelExampleProps = {
  activeTab?: ToolboxTab;
  onActiveTabChange?: (tab: ToolboxTab) => void;
};

export function TRNToolboxPanelExample(props: TRNToolboxPanelExampleProps) {
  const [localActiveTab, setLocalActiveTab] =
    useState<ToolboxTab>("bounded-scene");
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: ToolboxTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  const boundedRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3 rounded-md border border-zinc-700/80 bg-zinc-950/90 p-3">
      <TRNTabs
        value={activeTab}
        onValueChange={(next) => setActiveTab(next as ToolboxTab)}
      >
        <TRNTabsList className="flex flex-wrap">
          {TRN_TOOLBOX_PANEL_EXAMPLE_TABS.map((tab) => (
            <TRNTabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TRNTabsTrigger>
          ))}
        </TRNTabsList>
      </TRNTabs>

      {activeTab === "bounded-scene" ? (
        <div ref={boundedRef} className="relative h-[420px] overflow-hidden rounded-md border border-zinc-700/80 bg-linear-to-br from-sky-950 via-zinc-900 to-violet-950">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute left-1/4 top-1/3 h-24 w-24 rotate-12 rounded-lg bg-sky-500/30 blur-xl" />
            <div className="absolute right-1/4 bottom-1/4 h-32 w-32 rounded-full bg-violet-500/25 blur-2xl" />
          </div>
          <div className="pointer-events-none absolute left-3 top-3 text-[11px] font-medium text-zinc-400">
            Simulated viewport — drag the toolbox; snap near left/right edges.
          </div>
          <TRNToolboxPanel
            open
            title="Scene toolbox"
            prefixIcon={<Boxes className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
            boundsRef={boundedRef}
            persistRectStorageKey="trn-examples:toolbox-bounded"
            initialRect={{ x: 12, y: 44, width: 260, height: 200 }}
            minWidth={220}
            heightMode="auto"
            autoHeightMaxViewportFraction={0.92}
            zIndex={20}
            dragEdgeSnapPx={14}
            reopenStrategy="normalize"
            contentClassName="min-h-0 !border-0 !bg-zinc-950/35 !p-2"
          >
            <div className="space-y-2 text-xs text-zinc-300">
              <p>
                Collapse chevron shrinks to the header bar. Pin toggles more opaque
                glass for reading labels vs seeing the fake “3D” gradient behind.
              </p>
              <p className="text-zinc-500">
                Uses <code className="text-zinc-400">persistRectStorageKey</code>{" "}
                so geometry / collapsed / pin restore across reloads in this demo host.
              </p>
            </div>
          </TRNToolboxPanel>
        </div>
      ) : (
        <div className="space-y-3 rounded-md border border-zinc-700/80 bg-zinc-950/80 p-3 text-xs text-zinc-300">
          <p className="font-semibold text-zinc-100">Pin glass + Escape</p>
          <ul className="list-inside list-disc space-y-1 text-zinc-400">
            <li>
              Open the <span className="text-zinc-200">Bounded 3D-style scene</span>{" "}
              tab and expand the toolbox.
            </li>
            <li>
              Click inside the panel (or tab to focus it) so focus is contained — then
              press <kbd className="rounded border border-zinc-600 px-1">Esc</kbd> to
              collapse.
            </li>
            <li>
              Use the pin control to switch between default transparent toolbox glass and
              a more opaque surface for dense telemetry.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
