import { Boxes, GitBranch } from "lucide-react";
import { useState } from "react";
import { FlowLibraryTabPanel } from "./FlowLibraryTabPanel";
import { GroupLibraryTabPanel } from "./GroupLibraryTabPanel";

type SavedLibraryTab = "flows" | "groups";

type StudioSavedLibraryPanelProps = {
  dense?: boolean;
  query: string;
  borderColor?: string;
  remoteGroupsEnabled?: boolean;
};

export function StudioSavedLibraryPanel(props: StudioSavedLibraryPanelProps) {
  const { dense = false, query, borderColor, remoteGroupsEnabled = false } = props;
  const [tab, setTab] = useState<SavedLibraryTab>("flows");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="Saved library"
        className={`${dense ? "mb-2" : "mb-3"} flex rounded-lg bg-zinc-950/50 p-0.5 ring-1 ring-zinc-800/80`}
      >
        <button
          id="saved-tab-flows"
          type="button"
          role="tab"
          aria-selected={tab === "flows"}
          onClick={() => setTab("flows")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
            dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
          } ${
            tab === "flows" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <GitBranch className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
          Flows
        </button>
        <button
          id="saved-tab-groups"
          type="button"
          role="tab"
          aria-selected={tab === "groups"}
          onClick={() => setTab("groups")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
            dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
          } ${
            tab === "groups" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Boxes className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
          Groups
        </button>
      </div>

      <div
        className="min-h-0 flex-1"
        role="tabpanel"
        aria-labelledby={tab === "flows" ? "saved-tab-flows" : "saved-tab-groups"}
      >
        {tab === "flows" ? (
          <FlowLibraryTabPanel dense={dense} query={query} borderColor={borderColor} />
        ) : (
          <GroupLibraryTabPanel
            dense={dense}
            query={query}
            borderColor={borderColor}
            remoteEnabled={remoteGroupsEnabled}
          />
        )}
      </div>
    </div>
  );
}
