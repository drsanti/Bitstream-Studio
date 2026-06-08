import { FolderOpen, RefreshCw } from "lucide-react";
import { TRNButton, TRNHintText } from "../../../../../ui/TRN";
import { isVsCodeExtensionWebview } from "../../../../../isVsCodeExtensionWebview";
import {
  syncStudioLibraryWorkspaceNow,
  useStudioLibraryWorkspaceStore,
} from "../../../../persistence/studio-library-workspace-session";

function workspaceFolderLabel(workspacePath: string): string {
  const parts = workspacePath.replace(/\\/g, "/").split("/").filter((p) => p.length > 0);
  return parts[parts.length - 1] ?? workspacePath;
}

type StudioLibraryWorkspaceBarProps = {
  dense?: boolean;
};

export function StudioLibraryWorkspaceBar(props: StudioLibraryWorkspaceBarProps) {
  const { dense = false } = props;
  const status = useStudioLibraryWorkspaceStore((s) => s.status);
  const workspacePath = useStudioLibraryWorkspaceStore((s) => s.workspacePath);
  const lastError = useStudioLibraryWorkspaceStore((s) => s.lastError);
  const textSize = dense ? "text-[10px]" : "text-[11px]";

  if (!isVsCodeExtensionWebview()) {
    return (
      <TRNHintText tone="muted" className={`${textSize} leading-relaxed`}>
        Project presets are stored in this browser session. Open Sensor Studio in VS Code with a
        workspace folder to sync <span className="text-zinc-400">.bitstream/library/</span>.
      </TRNHintText>
    );
  }

  const badgeClass =
    status === "ready"
      ? "bg-emerald-950/50 text-emerald-200/90"
      : status === "syncing"
        ? "bg-cyan-950/50 text-cyan-200/90"
        : status === "error"
          ? "bg-red-950/50 text-red-200/90"
          : "bg-zinc-800/80 text-zinc-400";

  const badgeLabel =
    status === "ready" && workspacePath != null
      ? `Workspace · ${workspaceFolderLabel(workspacePath)}`
      : status === "syncing"
        ? "Syncing…"
        : status === "no-folder"
          ? "No workspace folder"
          : status === "error"
            ? "Sync error"
            : "Checking workspace…";

  return (
    <section className="mb-2 rounded-md border border-zinc-800/80 bg-zinc-950/35 px-2 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          <FolderOpen className="h-3 w-3 opacity-80" aria-hidden />
          {badgeLabel}
        </span>
        {status !== "unavailable" && status !== "no-folder" ? (
          <TRNButton
            type="button"
            size="compact"
            prefixIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
            hint="Pull presets from .bitstream/library/, merge with local project library, then push updates."
            disabled={status === "syncing"}
            onClick={() => {
              void syncStudioLibraryWorkspaceNow();
            }}
          >
            Sync now
          </TRNButton>
        ) : null}
      </div>
      <TRNHintText tone="muted" className={`mt-1.5 ${textSize} leading-relaxed`}>
        {status === "no-folder"
          ? "Open a folder in VS Code to enable .bitstream/library/ sync for team presets."
          : status === "ready"
            ? "Project Flows and Groups sync to .bitstream/library/ in your workspace (merge by updatedAt)."
            : status === "error" && lastError != null
              ? lastError
              : "Workspace sync connects local project presets with files on disk."}
      </TRNHintText>
    </section>
  );
}
