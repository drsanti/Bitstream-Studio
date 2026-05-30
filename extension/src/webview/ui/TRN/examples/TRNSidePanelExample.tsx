import { useState } from "react";
import { TRNSidePanel } from "../TRNSidePanel.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_SIDE_PANEL_EXAMPLE_TABS,
  type TRNSidePanelExampleTab,
} from "./exampleRegistry.js";
import { TRNSectionContainer } from "../TRNSectionContainer.js";

type TRNSidePanelExampleProps = {
  activeTab?: TRNSidePanelExampleTab;
  onActiveTabChange?: (tab: TRNSidePanelExampleTab) => void;
};

export function TRNSidePanelExample(props: TRNSidePanelExampleProps) {
  const [localTab, setLocalTab] = useState<TRNSidePanelExampleTab>("right-docked");
  const activeTab = props.activeTab ?? localTab;
  const setActiveTab = (tab: TRNSidePanelExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalTab(tab);
    }
  };

  const [openOverlay, setOpenOverlay] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(340);
  const [lastToggleReason, setLastToggleReason] = useState("none");
  const [controlledCollapsed, setControlledCollapsed] = useState(false);

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as TRNSidePanelExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_SIDE_PANEL_EXAMPLE_TABS.map((tab) => (
            <TRNTabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TRNTabsTrigger>
          ))}
        </TRNTabsList>
      </TRNTabs>

      <div className="h-[560px] border border-zinc-700/80 rounded-md bg-zinc-900/80 relative overflow-hidden">
        <div className="h-full min-h-0 p-3 overflow-y-auto">
          <div className="text-xs text-zinc-400 mb-2">
            Main Scene / Main Content placeholder
          </div>
          <div className="text-[10px] text-zinc-400 mb-2">
            Tip: use <code>Ctrl+\</code> to toggle panel; select separator then Arrow keys to resize.
          </div>
          <div className="text-[10px] text-zinc-400 mb-2">
            Last toggle reason: <span className="text-zinc-100">{lastToggleReason}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 15 }).map((_, idx) => (
              <div
                key={idx}
                className="h-20 rounded border border-zinc-700/80 bg-zinc-800/70"
              />
            ))}
          </div>
        </div>

        {activeTab === "right-docked" ? (
          <div className="absolute inset-y-0 right-0">
            <TRNSidePanel
              side="right"
              mode="docked"
              variant="inspector"
              title="Inspector"
              width={width}
              onWidthChange={setWidth}
              persistKey="trn-side-panel-example:right"
              collapsed={collapsed}
              collapsedPresentation="floating-only"
              collapsedFloatingSize={34}
              onToggle={(next, reason) => {
                setCollapsed(next);
                setLastToggleReason(reason);
              }}
              onCollapsedChange={setCollapsed}
              toggleHotkeys={["ctrl+\\", "cmd+\\"]}
              actions={<span className="text-[10px] text-zinc-400">Docked</span>}
            >
              <TRNSectionContainer title="Properties">
                <div className="text-xs text-zinc-400">Object A / Material / Transform</div>
              </TRNSectionContainer>
            </TRNSidePanel>
          </div>
        ) : null}

        {activeTab === "left-docked" ? (
          <div className="absolute inset-y-0 left-0">
            <TRNSidePanel
              side="left"
              mode="docked"
              variant="settings"
              title="Settings"
              defaultWidth={300}
              minWidth={220}
              maxWidth={480}
              persistKey="trn-side-panel-example:left"
              toggleHotkeys={["ctrl+\\", "cmd+\\"]}
            >
              <TRNSectionContainer title="Controls">
                <div className="text-xs text-zinc-400">Camera, render quality, layers.</div>
              </TRNSectionContainer>
            </TRNSidePanel>
          </div>
        ) : null}

        {activeTab === "overlay-glass" ? (
          <>
            <button
              type="button"
              className="absolute top-2 left-2 z-20 px-2 py-1 rounded border border-zinc-700/80 bg-zinc-950/90 text-xs"
              onClick={() => setOpenOverlay((v) => !v)}
            >
              {openOverlay ? "Hide overlay panel" : "Show overlay panel"}
            </button>
            {openOverlay ? (
              <TRNSidePanel
                side="right"
                mode="overlay"
                variant="inspector"
                title="3D Scene Inspector"
                glass
                showCloseButton
                onRequestClose={() => setOpenOverlay(false)}
                closeOnEsc
                closeOnOutsideClick
                backdrop="blur"
                overlayOffset={{ top: 36 }}
                persistKey="trn-side-panel-example:overlay"
                toggleHotkeys={["ctrl+\\", "cmd+\\"]}
                defaultWidth={360}
                actions={<span className="text-[10px] text-zinc-400">Glass</span>}
              >
                <TRNSectionContainer title="Scene">
                  <div className="text-xs text-zinc-400">Lighting, post FX, object list.</div>
                </TRNSectionContainer>
              </TRNSidePanel>
            ) : null}
          </>
        ) : null}

        {activeTab === "state-matrix" ? (
          <div className="absolute inset-0 p-3 overflow-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-56 relative border border-zinc-700/80 rounded-md bg-zinc-800/70 overflow-hidden">
                <TRNSidePanel side="left" mode="docked" defaultWidth={240} variant="settings" title="Left Docked">
                  <TRNSectionContainer title="A">
                    <div className="text-xs text-zinc-400">Expanded</div>
                  </TRNSectionContainer>
                </TRNSidePanel>
              </div>
              <div className="h-56 relative border border-zinc-700/80 rounded-md bg-zinc-800/70 overflow-hidden">
                <TRNSidePanel side="right" mode="docked" defaultWidth={240} defaultCollapsed variant="inspector" title="Right Docked (Floating)" collapsedPresentation="floating-only">
                  <TRNSectionContainer title="B">
                    <div className="text-xs text-zinc-400">Collapsed floating icon</div>
                  </TRNSectionContainer>
                </TRNSidePanel>
              </div>
              <div className="h-56 relative border border-zinc-700/80 rounded-md bg-zinc-800/70 overflow-hidden">
                <TRNSidePanel side="left" mode="overlay" backdrop="dim" defaultWidth={220} variant="settings" title="Left Overlay">
                  <TRNSectionContainer title="C">
                    <div className="text-xs text-zinc-400">Overlay + dim</div>
                  </TRNSectionContainer>
                </TRNSidePanel>
              </div>
              <div className="h-56 relative border border-zinc-700/80 rounded-md bg-zinc-800/70 overflow-hidden">
                <TRNSidePanel side="right" mode="overlay" glass backdrop="blur" defaultWidth={260} variant="inspector" title="Right Overlay">
                  <TRNSectionContainer title="D">
                    <div className="text-xs text-zinc-400">Overlay + glass + blur</div>
                  </TRNSectionContainer>
                </TRNSidePanel>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "floating-anchor" ? (
          <div className="absolute inset-y-0 right-0">
            <TRNSidePanel
              side="right"
              mode="docked"
              variant="inspector"
              title="Floating Anchor Demo"
              defaultCollapsed
              collapsedPresentation="floating-only"
              collapsedFloatingAnchor={{ right: 12, top: 84 }}
              collapsedFloatingSize={36}
              persistKey="trn-side-panel-example:floating-anchor"
              toggleHotkeys={["ctrl+\\", "cmd+\\"]}
            >
              <TRNSectionContainer title="Anchor">
                <div className="text-xs text-zinc-400">
                  The collapsed icon is anchored at top-right with custom offset.
                </div>
              </TRNSectionContainer>
            </TRNSidePanel>
          </div>
        ) : null}

        {activeTab === "controlled-toggle" ? (
          <div className="absolute inset-y-0 right-0">
            <TRNSidePanel
              side="right"
              mode="docked"
              variant="inspector"
              title="Controlled Inspector"
              width={width}
              onWidthChange={setWidth}
              collapsed={controlledCollapsed}
              collapsedPresentation="floating-only"
              onToggle={(next, reason) => {
                setControlledCollapsed(next);
                setLastToggleReason(reason);
              }}
              onCollapsedChange={setControlledCollapsed}
              toggleHotkeys={["ctrl+\\", "cmd+\\"]}
              actions={
                <button
                  type="button"
                  className="px-2 py-0.5 rounded border border-zinc-700/80 text-[10px] hover:bg-zinc-800/70"
                  onClick={() => setControlledCollapsed((v) => !v)}
                >
                  {controlledCollapsed ? "Expand" : "Collapse"}
                </button>
              }
            >
              <TRNSectionContainer title="Telemetry">
                <div className="text-xs text-zinc-400">Last toggle reason: {lastToggleReason}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Current state: {controlledCollapsed ? "collapsed" : "expanded"}
                </div>
              </TRNSectionContainer>
            </TRNSidePanel>
          </div>
        ) : null}
      </div>
    </div>
  );
}
