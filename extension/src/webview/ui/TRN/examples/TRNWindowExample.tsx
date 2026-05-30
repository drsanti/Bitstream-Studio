import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bug, Settings2, TerminalSquare } from "lucide-react";
import { TRNWindow } from "../TRNWindow.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_WINDOW_EXAMPLE_TABS,
  type TRNWindowExampleTab,
} from "./exampleRegistry.js";

type WindowTab = TRNWindowExampleTab;

function DemoLauncher(props: {
  title: string;
  description: string;
  onOpen: () => void;
  buttonText?: string;
}) {
  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-2">
      <div className="text-sm font-semibold">{props.title}</div>
      <div className="text-xs text-zinc-400">{props.description}</div>
      <button
        type="button"
        className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
        onClick={props.onOpen}
      >
        {props.buttonText ?? "Open demo"}
      </button>
    </div>
  );
}

type TRNWindowExampleProps = {
  activeTab?: WindowTab;
  onActiveTabChange?: (tab: WindowTab) => void;
};

export function TRNWindowExample(props: TRNWindowExampleProps) {
  const [localActiveTab, setLocalActiveTab] = useState<WindowTab>("basic-modal");
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: WindowTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };

  const [openBasic, setOpenBasic] = useState(false);
  const [openNonModal, setOpenNonModal] = useState(false);
  const [openPreserve, setOpenPreserve] = useState(false);
  const [openNormalize, setOpenNormalize] = useState(false);
  const [openReset, setOpenReset] = useState(false);
  const [openConstraint, setOpenConstraint] = useState(false);
  const [openIconA, setOpenIconA] = useState(false);
  const [openIconB, setOpenIconB] = useState(false);
  const [openBounded, setOpenBounded] = useState(false);
  const boundedDemoRef = useRef<HTMLDivElement>(null);
  const [openBoundedAuto, setOpenBoundedAuto] = useState(false);
  const boundedAutoRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as WindowTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_WINDOW_EXAMPLE_TABS.map((tab) => (
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
          {activeTab === "basic-modal" ? (
            <>
              <DemoLauncher
                title="Basic modal window"
                description="Draggable + resizable modal window with maximize/restore and footer metrics."
                onOpen={() => setOpenBasic(true)}
              />
              <TRNWindow
                open={openBasic}
                title="Basic Modal Example"
                onClose={() => setOpenBasic(false)}
                modal
                draggable
                resizable
                initialRect={{ x: 140, y: 90, width: 760, height: 500 }}
              >
                <div className="space-y-2 text-xs">
                  <div className="font-semibold">TRNWindow basic modal</div>
                  <div className="text-zinc-400">
                    Try drag header, resize corner, maximize, then restore.
                  </div>
                </div>
              </TRNWindow>
            </>
          ) : null}

          {activeTab === "non-modal" ? (
            <>
              <DemoLauncher
                title="Non-modal floating window"
                description="Window stays interactive without backdrop. You can still close it with the header close button."
                onOpen={() => setOpenNonModal(true)}
              />
              <TRNWindow
                open={openNonModal}
                title="Floating Inspector"
                onClose={() => setOpenNonModal(false)}
                modal={false}
                draggable
                resizable={false}
                initialRect={{ x: 200, y: 120, width: 560, height: 360 }}
                prefixIcon={<TerminalSquare className="h-3.5 w-3.5" />}
              >
                <div className="space-y-2 text-xs">
                  <div className="font-semibold">Non-modal mode</div>
                  <div className="text-zinc-400">
                    Backdrop is disabled and other page content remains clickable.
                  </div>
                </div>
              </TRNWindow>
            </>
          ) : null}

          {activeTab === "reopen-strategy" ? (
            <>
              <div className="text-xs text-zinc-400">
                Open each window and move it around, close it, resize your app viewport, then reopen to compare behavior.
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setOpenPreserve(true)}
                >
                  Open preserve
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setOpenNormalize(true)}
                >
                  Open normalize
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setOpenReset(true)}
                >
                  Open reset
                </button>
              </div>
              <TRNWindow
                open={openPreserve}
                title="reopenStrategy: preserve"
                onClose={() => setOpenPreserve(false)}
                reopenStrategy="preserve"
                initialRect={{ x: 160, y: 90, width: 620, height: 360 }}
              >
                <div className="text-xs">Keeps last rect exactly.</div>
              </TRNWindow>
              <TRNWindow
                open={openNormalize}
                title="reopenStrategy: normalize"
                onClose={() => setOpenNormalize(false)}
                reopenStrategy="normalize"
                initialRect={{ x: 200, y: 130, width: 620, height: 360 }}
              >
                <div className="text-xs">Keeps last rect, then clamps to current viewport.</div>
              </TRNWindow>
              <TRNWindow
                open={openReset}
                title="reopenStrategy: reset"
                onClose={() => setOpenReset(false)}
                reopenStrategy="reset"
                initialRect={{ x: 240, y: 170, width: 620, height: 360 }}
              >
                <div className="text-xs">Resets to initialRect every reopen.</div>
              </TRNWindow>
            </>
          ) : null}

          {activeTab === "constraints" ? (
            <>
              <DemoLauncher
                title="Min size and constrained interaction"
                description="This demo uses strict minWidth/minHeight and disables resize handle."
                onOpen={() => setOpenConstraint(true)}
                buttonText="Open constraints demo"
              />
              <TRNWindow
                open={openConstraint}
                title="Constraint Demo"
                onClose={() => setOpenConstraint(false)}
                minWidth={520}
                minHeight={320}
                draggable={false}
                resizable={false}
                initialRect={{ x: 180, y: 120, width: 640, height: 420 }}
              >
                <div className="space-y-2 text-xs">
                  <div className="font-semibold">Interaction constrained</div>
                  <ul className="list-disc pl-4 text-zinc-400 space-y-1">
                    <li>Dragging disabled</li>
                    <li>Resizing disabled</li>
                    <li>Min width/height still enforced internally</li>
                  </ul>
                </div>
              </TRNWindow>
            </>
          ) : null}

          {activeTab === "bounded-parent" ? (
            <>
              <div className="text-xs text-zinc-400">
                Window geometry is relative to the shaded panel below (`boundsRef`). Drag and maximize stay inside the panel; position persists under localStorage when enabled.
              </div>
              <DemoLauncher
                title="Bounded panel window"
                description="Opens a TRNWindow portaled into the panel — not full viewport."
                onOpen={() => setOpenBounded(true)}
                buttonText="Open bounded window"
              />
              <div
                ref={boundedDemoRef}
                className="relative h-[min(22rem,55vh)] min-h-48 overflow-hidden rounded-md border border-zinc-600/80 bg-zinc-900/40"
              >
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-zinc-600">
                  Parent bounds (relative + overflow hidden)
                </div>
                <TRNWindow
                  open={openBounded}
                  title="Bounded"
                  onClose={() => setOpenBounded(false)}
                  boundsRef={boundedDemoRef}
                  modal={false}
                  minWidth={220}
                  minHeight={140}
                  initialRect={{ x: 16, y: 16, width: 320, height: 220 }}
                  showFooter={false}
                  persistRectStorageKey="trn-example:window-bounded-demo"
                  draggable
                  resizable
                >
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold">Inside bounds</div>
                    <p className="text-zinc-400">
                      Try drag, resize, and maximize — all clamp to the gray panel.
                    </p>
                  </div>
                </TRNWindow>
              </div>
            </>
          ) : null}

          {activeTab === "bounded-auto-height" ? (
            <>
              <div className="text-xs text-zinc-400">
                Same as bounded mode, but <code className="text-zinc-300">heightMode=&quot;auto&quot;</code>
                : shell hugs content up to a fraction of the <strong>panel</strong> height (not{" "}
                <code className="text-zinc-300">100vh</code>). Long body scrolls inside the window.
              </div>
              <DemoLauncher
                title="Bounded auto-height window"
                description="Open a tall auto-height window inside the panel; footer shows measured shell height."
                onOpen={() => setOpenBoundedAuto(true)}
                buttonText="Open bounded auto-height"
              />
              <div
                ref={boundedAutoRef}
                className="relative h-[min(22rem,55vh)] min-h-48 overflow-hidden rounded-md border border-zinc-600/80 bg-zinc-900/40"
              >
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-zinc-600">
                  Parent bounds (relative + overflow hidden)
                </div>
                <TRNWindow
                  open={openBoundedAuto}
                  title="Auto inside panel"
                  onClose={() => setOpenBoundedAuto(false)}
                  boundsRef={boundedAutoRef}
                  modal={false}
                  heightMode="auto"
                  autoHeightMaxViewportFraction={0.72}
                  minWidth={220}
                  minHeight={140}
                  initialRect={{ x: 12, y: 12, width: 300, height: 200 }}
                  reopenStrategy="reset"
                  persistRectStorageKey="trn-example:window-bounded-auto-height"
                  draggable
                  resizable
                  showFooter
                  showMaximize
                >
                  <div className="space-y-1 text-[11px] leading-snug text-zinc-300">
                    <p className="font-semibold text-zinc-100">
                      Scroll this body — cap uses overlay height from <code className="text-zinc-400">boundsRef</code>.
                    </p>
                    {Array.from({ length: 42 }, (_, i) => (
                      <p key={i}>
                        Line {i + 1}: The content region max-height is derived from the gray panel size, so scrolling
                        stays consistent when the panel resizes.
                      </p>
                    ))}
                  </div>
                </TRNWindow>
              </div>
            </>
          ) : null}

          {activeTab === "icons-title" ? (
            <>
              <div className="text-xs text-zinc-400">
                Prefix icon can be customized per window. Default icon appears when `prefixIcon` is omitted.
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setOpenIconA(true)}
                >
                  Open settings icon
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() => setOpenIconB(true)}
                >
                  Open debug icon
                </button>
              </div>
              <TRNWindow
                open={openIconA}
                title="Settings Window"
                prefixIcon={<Settings2 className="h-3.5 w-3.5" />}
                onClose={() => setOpenIconA(false)}
                initialRect={{ x: 160, y: 90, width: 560, height: 360 }}
              >
                <div className="text-xs">Custom prefix icon: Settings2</div>
              </TRNWindow>
              <TRNWindow
                open={openIconB}
                title="Debug Window"
                prefixIcon={<Bug className="h-3.5 w-3.5" />}
                onClose={() => setOpenIconB(false)}
                initialRect={{ x: 240, y: 170, width: 560, height: 360 }}
              >
                <div className="text-xs">Custom prefix icon: Bug</div>
              </TRNWindow>
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
