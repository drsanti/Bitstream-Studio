import type { ReactNode } from "react";
import { Clipboard, FolderOpen } from "lucide-react";
import { ModelLoaderGroupCard } from "../ui/catalog/ModelLoaderGroupCard.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { TRNHintText } from "../ui/TRN/TRNHintText.js";

export function FreeAssetsLoaderSaveFolderFooter(props: {
  pathToShow: string;
  isExtension: boolean;
  supportsFolderPicker: boolean;
  hasFolderOverride: boolean;
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
    onPickFolder,
    onClearFolderOverride,
    onOpenFolder,
    onCopyPath,
  } = props;

  const card = (
      <ModelLoaderGroupCard
        title="Save folder & sync location"
        defaultOpen={false}
        className="border-zinc-700/70 bg-zinc-900/45 shadow-none ring-0"
        contentClassName="space-y-2.5"
      >
        <p className="break-all text-[11px] leading-snug text-zinc-200" title={pathToShow}>
          {pathToShow}
        </p>
        {isExtension ? (
          <TRNHintText>
            Per-user extension storage (globalStorage) — not the install folder or repo tree.
          </TRNHintText>
        ) : (
          <TRNHintText tone="warn">
            Browser + bridge: same globalStorage layout as the VS Code extension unless you set
            TERNION_BRIDGE_FREE_ASSETS_OUTPUT_DIR.
          </TRNHintText>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
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
      </ModelLoaderGroupCard>
  );

  return card;
}
