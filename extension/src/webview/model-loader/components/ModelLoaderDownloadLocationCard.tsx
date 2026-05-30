import { Clipboard, FolderOpen } from "lucide-react";
import { MODEL_LOADER_SKY_BUTTON_CLASS } from "../modelLoaderSkyButton";
import { ModelLoaderGroupCard } from "./ModelLoaderGroupCard";

export interface ModelLoaderDownloadLocationCardProps {
  /** Folder used for the next download (default root or user-picked). */
  outputDir: string;
  /** Extension: resolved default from host (`globalStorage/.../assets/tesaiot/models`). */
  defaultRootHint: string;
  isExtension: boolean;
  supportsFolderPicker: boolean;
  /** Last completed download folder, if any. */
  lastDownloadOutputDir: string | null;
  onPickFolder: () => void;
  onRevealPath: (absolutePath: string) => void | Promise<void>;
}

export function ModelLoaderDownloadLocationCard({
  outputDir,
  defaultRootHint,
  isExtension,
  supportsFolderPicker,
  lastDownloadOutputDir,
  onPickFolder,
  onRevealPath,
}: ModelLoaderDownloadLocationCardProps) {
  const pathToShow = outputDir.trim() || defaultRootHint.trim();
  const showFetching = isExtension && !pathToShow;

  return (
    <ModelLoaderGroupCard title="Download location" defaultOpen={false}>
      {showFetching ? (
        <p className="text-xs text-gray-400">Resolving default save folder…</p>
      ) : (
        <>
          <p className="break-all font-mono text-[11px] leading-relaxed text-gray-200" title={pathToShow}>
            {pathToShow}
          </p>
          {isExtension && defaultRootHint && outputDir.trim() === defaultRootHint.trim() ? (
            <p className="mt-1 text-[11px] leading-snug text-gray-500">
              Default: per-user extension storage (<code className="text-gray-400">globalStorage</code>
              ). Products save under subfolders of this path.
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={MODEL_LOADER_SKY_BUTTON_CLASS}
              disabled={!pathToShow}
              onClick={() => void onRevealPath(pathToShow)}
            >
              {isExtension ? (
                <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              {isExtension ? "Open in File Explorer" : "Copy path"}
            </button>
            {supportsFolderPicker ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-gray-200 hover:bg-white/10"
                onClick={() => void onPickFolder()}
              >
                Choose folder…
              </button>
            ) : null}
          </div>
          {lastDownloadOutputDir && lastDownloadOutputDir.trim() !== pathToShow.trim() ? (
            <div className="mt-3 border-t border-white/10 pt-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Last download saved to
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-emerald-200/90">{lastDownloadOutputDir}</p>
              <button
                type="button"
                className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-sky-400 hover:underline"
                onClick={() => void onRevealPath(lastDownloadOutputDir)}
              >
                {isExtension ? (
                  <>
                    <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                    Open that folder
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3.5 w-3.5" aria-hidden />
                    Copy last path
                  </>
                )}
              </button>
            </div>
          ) : null}
        </>
      )}
    </ModelLoaderGroupCard>
  );
}
