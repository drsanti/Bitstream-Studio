import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TRNContainer } from "../TRNContainer.js";
import { TRNTabs, TRNTabsList, TRNTabsTrigger } from "../TRNTabs.js";
import {
  TRN_CONTAINER_EXAMPLE_TABS,
  type TRNContainerExampleTab,
} from "./exampleRegistry.js";

type ExampleTab = TRNContainerExampleTab;

type TRNContainerExampleProps = {
  activeTab?: ExampleTab;
  onActiveTabChange?: (tab: ExampleTab) => void;
};

export function TRNContainerExample(props: TRNContainerExampleProps) {
  const [localActiveTab, setLocalActiveTab] = useState<ExampleTab>("fill-stack");
  const activeTab = props.activeTab ?? localActiveTab;
  const setActiveTab = (tab: ExampleTab) => {
    props.onActiveTabChange?.(tab);
    if (props.activeTab == null) {
      setLocalActiveTab(tab);
    }
  };
  const refContainer = useRef<HTMLDivElement>(null);

  return (
    <div className="border border-zinc-700/80 rounded-md bg-zinc-950/90 p-3 space-y-3">
      <TRNTabs value={activeTab} onValueChange={(next) => setActiveTab(next as ExampleTab)}>
        <TRNTabsList className="flex flex-wrap">
          {TRN_CONTAINER_EXAMPLE_TABS.map((tab) => (
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
        >
          {activeTab === "fill-stack" ? (
            <div className="h-48">
              <TRNContainer
                mode="fill-parent"
                layout="stack"
                gap="2"
                scroll="y"
                className="border border-zinc-700/80"
              >
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-1 text-xs rounded border border-zinc-700/80 bg-zinc-900/70"
                  >
                    Stack item {idx + 1}
                  </div>
                ))}
              </TRNContainer>
            </div>
          ) : null}

          {activeTab === "fit-minimal" ? (
            <TRNContainer
              mode="fit-content"
              layout="stack"
              gap="2"
              scroll="none"
              className="border border-zinc-700/80"
            >
              <div className="px-2 py-1 text-xs rounded border border-zinc-700/80 bg-zinc-900/70">
                fit-content container
              </div>
              <div className="px-2 py-1 text-xs rounded border border-zinc-700/80 bg-zinc-900/70">
                no scroll
              </div>
            </TRNContainer>
          ) : null}

          {activeTab === "direction" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TRNContainer
                mode="fit-content"
                layout="flex"
                direction="column"
                gap="2"
                className="w-full border border-zinc-700/80"
              >
                <div className="text-xs font-semibold">direction=column</div>
                <div className="px-2 py-1 text-xs rounded border border-zinc-700/80">
                  A
                </div>
                <div className="px-2 py-1 text-xs rounded border border-zinc-700/80">
                  B
                </div>
              </TRNContainer>
              <TRNContainer
                mode="fit-content"
                layout="flex"
                direction="row"
                gap="2"
                className="w-full border border-zinc-700/80 items-center"
              >
                <div className="text-xs font-semibold mr-2">direction=row</div>
                <div className="px-2 py-1 text-xs rounded border border-zinc-700/80">
                  A
                </div>
                <div className="px-2 py-1 text-xs rounded border border-zinc-700/80">
                  B
                </div>
              </TRNContainer>
            </div>
          ) : null}

          {activeTab === "scroll" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TRNContainer
                mode="fit-content"
                layout="stack"
                scroll="x"
                className="w-full border border-zinc-700/80"
              >
                <div className="text-xs font-semibold">scroll=x</div>
                <div className="w-[520px] px-2 py-1 text-xs rounded border border-zinc-700/80">
                  very-wide-row-content very-wide-row-content
                  very-wide-row-content
                </div>
              </TRNContainer>
              <div className="h-36">
                <TRNContainer
                  mode="fill-parent"
                  layout="stack"
                  scroll="y"
                  className="border border-zinc-700/80"
                >
                  <div className="text-xs font-semibold">scroll=y</div>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="text-xs px-2 py-1 border border-zinc-700/80 rounded"
                    >
                      item {i + 1}
                    </div>
                  ))}
                </TRNContainer>
              </div>
              <div className="h-36">
                <TRNContainer
                  mode="fill-parent"
                  layout="stack"
                  scroll="both"
                  className="border border-zinc-700/80"
                >
                  <div className="text-xs font-semibold">scroll=both</div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[340px] text-xs px-2 py-1 border border-zinc-700/80 rounded"
                    >
                      wide item {i + 1} wide item {i + 1} wide item {i + 1}
                    </div>
                  ))}
                </TRNContainer>
              </div>
            </div>
          ) : null}

          {activeTab === "gap-matrix" ? (
            <TRNContainer
              mode="fit-content"
              layout="stack"
              gap="2"
              className="w-full"
            >
              {(["0", "1", "2", "3", "4", "6", "8"] as const).map((gap) => (
                <TRNContainer
                  key={gap}
                  mode="fit-content"
                  layout="flex"
                  direction="row"
                  gap={gap}
                  className="w-full border border-zinc-700/80"
                >
                  <div className="w-20 text-xs font-semibold">gap={gap}</div>
                  <div className="px-2 py-1 text-xs border border-zinc-700/80 rounded">
                    A
                  </div>
                  <div className="px-2 py-1 text-xs border border-zinc-700/80 rounded">
                    B
                  </div>
                  <div className="px-2 py-1 text-xs border border-zinc-700/80 rounded">
                    C
                  </div>
                </TRNContainer>
              ))}
            </TRNContainer>
          ) : null}

          {activeTab === "cols" ? (
            <TRNContainer
              mode="fit-content"
              layout="stack"
              gap="2"
              className="w-full"
            >
              {[1, 2, 3, 4, 6, 12].map((cols) => (
                <TRNContainer
                  key={cols}
                  mode="fit-content"
                  layout="grid"
                  cols={cols as 1 | 2 | 3 | 4 | 6 | 12}
                  gap="2"
                  className="w-full border border-zinc-700/80"
                >
                  {Array.from({ length: cols }).map((_, i) => (
                    <div
                      key={i}
                      className="text-xs px-2 py-1 border border-zinc-700/80 rounded"
                    >
                      cols={cols} / item {i + 1}
                    </div>
                  ))}
                </TRNContainer>
              ))}
            </TRNContainer>
          ) : null}

          {activeTab === "native-props" ? (
            <TRNContainer
              id="trn-native-props-example"
              role="region"
              aria-label="TRN native props region"
              data-testid="trn-native-props"
              mode="fit-content"
              layout="stack"
              className="w-full border border-zinc-700/80"
              onClick={() => {
                // no-op demo callback for native event passthrough
              }}
            >
              <div className="text-xs font-semibold">
                Native props passthrough
              </div>
              <div className="text-xs text-zinc-400">
                Includes id/role/aria/data-testid/onClick on root div.
              </div>
            </TRNContainer>
          ) : null}

          {activeTab === "ref" ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() =>
                    refContainer.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    })
                  }
                >
                  Scroll to top
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-zinc-700/80 hover:bg-zinc-800/70"
                  onClick={() =>
                    refContainer.current?.scrollTo({
                      top: refContainer.current.scrollHeight,
                      behavior: "smooth",
                    })
                  }
                >
                  Scroll to bottom
                </button>
              </div>
              <div className="h-44">
                <TRNContainer
                  ref={refContainer}
                  mode="fill-parent"
                  layout="stack"
                  scroll="y"
                  className="border border-zinc-700/80"
                >
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={i}
                      className="text-xs px-2 py-1 border border-zinc-700/80 rounded"
                    >
                      ref item {i + 1}
                    </div>
                  ))}
                </TRNContainer>
              </div>
            </div>
          ) : null}

          {activeTab === "nested" ? (
            <TRNContainer
              mode="fit-content"
              layout="stack"
              gap="2"
              className="w-full border border-zinc-700/80"
            >
              <div className="text-xs font-semibold">Outer container</div>
              <TRNContainer
                mode="fit-content"
                layout="grid"
                cols={2}
                gap="2"
                className="w-full border border-zinc-700/80"
              >
                <TRNContainer
                  mode="fit-content"
                  layout="stack"
                  gap="1"
                  className="border border-zinc-700/80"
                >
                  <div className="text-xs">Nested A1</div>
                  <div className="text-xs">Nested A2</div>
                </TRNContainer>
                <TRNContainer
                  mode="fit-content"
                  layout="wrap"
                  direction="row"
                  gap="1"
                  className="border border-zinc-700/80"
                >
                  <span className="text-xs">chip-a</span>
                  <span className="text-xs">chip-b</span>
                  <span className="text-xs">chip-c</span>
                </TRNContainer>
              </TRNContainer>
            </TRNContainer>
          ) : null}

          {activeTab === "wrap" ? (
            <TRNContainer
              mode="fit-content"
              layout="wrap"
              direction="row"
              gap="2"
              className="w-full border border-zinc-700/80"
            >
              {["chip-1", "chip-2", "chip-3", "chip-4", "chip-5", "chip-6"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="px-2 py-1 text-xs rounded-md border border-zinc-700/80 bg-zinc-900/70"
                  >
                    {chip}
                  </span>
                ),
              )}
            </TRNContainer>
          ) : null}

          {activeTab === "split-row" ? (
            <TRNContainer
              mode="fit-content"
              layout="flex"
              direction="row"
              className="w-full justify-between items-center border border-zinc-700/80"
            >
              <div className="px-2 py-1 text-xs rounded border border-zinc-700/80 bg-zinc-900/70">
                Left content
              </div>
              <div className="px-2 py-1 text-xs rounded border border-zinc-700/80 bg-zinc-900/70">
                Right content
              </div>
            </TRNContainer>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
