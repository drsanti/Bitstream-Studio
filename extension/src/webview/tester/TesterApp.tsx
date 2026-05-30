import { Cpu, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { TRNIconRailSplitPane, type TRNInspectorIconRailItem } from "../ui/TRN";

const ITEMS: readonly TRNInspectorIconRailItem<"nodes" | "sim">[] = [
  { id: "nodes", label: "Nodes", Icon: LayoutGrid },
  { id: "sim", label: "Simulation", Icon: Cpu },
];

export type TesterAppProps = {
  iconSide?: "left" | "right";
};

function readTesterIconSide(): "left" | "right" {
  try {
    const v = new URLSearchParams(window.location.search).get("iconSide");
    return v === "left" ? "left" : "right";
  } catch {
    return "right";
  }
}

function TesterPanel(props: { title: string; iconSide: "left" | "right" }) {
  const { title, iconSide } = props;
  const [active, setActive] = useState<"nodes" | "sim">("nodes");

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </div>
      <div
        className={
          "h-full min-h-0 w-full border border-white/10 bg-zinc-950/70 pt-3 pb-3 shadow-[0_16px_40px_rgba(0,0,0,0.55)] " +
          (iconSide === "left"
            ? "rounded-l-xl pl-0 pr-3"
            : "rounded-r-xl pl-3 pr-0")
        }
      >
        <TRNIconRailSplitPane
          iconSide={iconSide}
          railAriaLabel="Tester tabs"
          railItems={ITEMS}
          railActiveId={active}
          onRailActiveChange={setActive}
          railTone="emerald"
          header={
            <div className="bg-transparent px-3 py-2 text-sm font-semibold">
              Header
            </div>
          }
          className="h-full min-h-0"
          contentClassName="rounded-md border border-white/10 bg-transparent"
          edgeHintSizePx={28}
        >
          <div className="space-y-2 text-[12px] leading-relaxed text-zinc-200">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Content container (scrollable)
            </div>
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="rounded border border-white/5 bg-white/2 px-2 py-1 text-zinc-200/90"
              >
                Row {i + 1}
              </div>
            ))}
          </div>
        </TRNIconRailSplitPane>
      </div>
    </div>
  );
}

export function TesterApp(props: TesterAppProps) {
  const iconSide = props.iconSide ?? readTesterIconSide();
  const compare = (() => {
    try {
      return new URLSearchParams(window.location.search).has("compare");
    } catch {
      return false;
    }
  })();
  const bothSides = (() => {
    try {
      return new URLSearchParams(window.location.search).has("bothSides");
    } catch {
      return false;
    }
  })();

  return (
    <div className="flex h-full w-full items-stretch justify-end bg-black/60 p-6 text-zinc-200">
      {bothSides ? (
        <div className="flex h-full min-h-0 w-full min-w-0 items-stretch justify-between gap-6">
          <div className="flex h-full min-h-0 w-[min(92vw,420px)] min-w-0 flex-col">
            <TesterPanel title="Pinned left" iconSide="right" />
          </div>
          <div className="flex h-full min-h-0 w-[min(92vw,420px)] min-w-0 flex-col">
            <TesterPanel title="Pinned right" iconSide="left" />
          </div>
        </div>
      ) : compare ? (
        <div className="ml-auto flex h-full min-h-0 w-fit max-w-[980px] items-stretch gap-4">
          <TesterPanel title="Icon side: right" iconSide="right" />
          <TesterPanel title="Icon side: left" iconSide="left" />
        </div>
      ) : (
        <div className="flex h-full min-h-0 w-[min(92vw,420px)] min-w-0 flex-col">
          <TesterPanel title={`Icon side: ${iconSide}`} iconSide={iconSide} />
        </div>
      )}
    </div>
  );
}
