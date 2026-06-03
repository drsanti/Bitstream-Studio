import type { ReactNode } from "react";
import { Clipboard, FolderOpen } from "lucide-react";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { TRNHintText } from "../ui/TRN/TRNHintText.js";
import { LOADER_MODAL_SECTION_CLASS } from "./loader-modal-chrome.js";

export function FreeAssetsLoaderSummaryStrip(props: {
  pathToShow: string;
  isExtension: boolean;
  supportsFolderPicker: boolean;
  hasFolderOverride: boolean;
  onlineCount: number;
  localCount: number;
  selectedCount: number;
  listLoading: boolean;
  onPickFolder: () => void;
  onClearFolderOverride: () => void;
  onOpenFolder: () => void;
  onCopyPath: () => void;
}): ReactNode {
  const {
    pathToShow,
    isExtension,
    supportsFolderPicker,
    hasFolderOverride,
    onlineCount,
    localCount,
    selectedCount,
    listLoading,
    onPickFolder,
    onClearFolderOverride,
    onOpenFolder,
    onCopyPath,
  } = props;

  return (
    <section className={LOADER_MODAL_SECTION_CLASS}>
      <div className="rounded-lg border border-zinc-700/70 bg-zinc-900/45 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Save folder
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-zinc-500">
            <span>
              Catalog:{" "}
              <span className="font-medium text-zinc-300">
                {listLoading ? "…" : String(onlineCount)}
              </span>
            </span>
            <span>
              On disk: <span className="font-medium text-zinc-300">{localCount}</span>
            </span>
            <span>
              Selected: <span className="font-medium text-cyan-200/90">{selectedCount}</span>
            </span>
          </div>
        </div>
        <p
          className="mt-1.5 break-all text-[11px] leading-snug text-zinc-200"
          title={pathToShow}
        >
          {pathToShow}
        </p>
        {isExtension ? (
          <TRNHintText className="mt-1">
            Per-user extension storage (globalStorage) — not the install folder or repo tree.
          </TRNHintText>
        ) : (
          <TRNHintText tone="warn" className="mt-1">
            Browser + bridge: same globalStorage layout as the VS Code extension unless you set
            TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR.
          </TRNHintText>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {supportsFolderPicker ? (
            <TRNButton size="compact" onClick={onPickFolder}>
              Choose folder…
            </TRNButton>
          ) : null}
          {hasFolderOverride ? (
            <TRNButton size="compact" onClick={onClearFolderOverride}>
              Use default folder
            </TRNButton>
          ) : null}
          <TRNButton
            size="compact"
            selected
            prefixIcon={
              isExtension ? (
                <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )
            }
            onClick={onOpenFolder}
          >
            {isExtension ? "Open folder" : "Copy path"}
          </TRNButton>
          {isExtension ? (
            <TRNButton
              size="compact"
              prefixIcon={<Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              onClick={onCopyPath}
            >
              Copy path
            </TRNButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}
