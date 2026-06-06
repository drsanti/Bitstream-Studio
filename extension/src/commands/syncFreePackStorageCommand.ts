import * as vscode from "vscode";
import { formatFreePackBytes } from "../asset-sync/diagnoseFreePackStorageReport";
import {
  syncTernionFreeAssets,
  type SyncTernionFreeAssetsProgress,
} from "../asset-sync/syncTernionFreeAssets";
import { getFreeGithubMirrorRootUri } from "../extensionAssetPaths";
import { resolveGithubTokenForAssetSync } from "../githubTokenForAssetSync";
import { getBitstreamStudioOutputChannel } from "./bitstreamStudioOutputChannel";

const FREE_PACK_SYNCED_FILE_COUNT_KEY = "ternion.freePack.syncedFileCount";

function formatSyncProgressMessage(
  prog: SyncTernionFreeAssetsProgress,
  listingFallbackNote?: string,
): string {
  if (prog.phase === "listing") {
    if (listingFallbackNote?.trim()) {
      return listingFallbackNote.trim();
    }
    if (prog.totalFiles != null && prog.totalFiles > 0) {
      return `Listing catalog (${prog.totalFiles} files)…`;
    }
    return "Listing catalog…";
  }
  if (prog.phase === "error") {
    return "Sync failed";
  }
  if (prog.currentPath?.trim()) {
    return prog.currentPath.trim();
  }
  if (
    prog.totalFiles != null &&
    prog.totalFiles > 0 &&
    prog.fileIndex != null
  ) {
    return `Downloading ${prog.fileIndex}/${prog.totalFiles} (${prog.percent ?? 0}%)`;
  }
  return `Downloading (${prog.percent ?? 0}%)`;
}

export function registerSyncFreePackStorageCommand(
  context: vscode.ExtensionContext,
): vscode.Disposable {
  return vscode.commands.registerCommand(
    "bitstream-studio.syncFreePackStorage",
    async () => {
      const outputRootDir = getFreeGithubMirrorRootUri(context).fsPath;
      const confirm = await vscode.window.showInformationMessage(
        `Download the TERNION free asset pack into globalStorage?\n${outputRootDir}`,
        { modal: true },
        "Sync",
      );
      if (confirm !== "Sync") {
        return;
      }

      let listingFallbackNote: string | undefined;

      try {
        const result = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Syncing TERNION free pack",
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: "Starting…" });
            return syncTernionFreeAssets({
              outputRootDir,
              githubToken: resolveGithubTokenForAssetSync(),
              onListingFallback: (message) => {
                listingFallbackNote = message;
              },
              onProgress: (prog) => {
                progress.report({
                  message: formatSyncProgressMessage(prog, listingFallbackNote),
                });
              },
            });
          },
        );

        if (result.errors.length > 0) {
          const out = getBitstreamStudioOutputChannel();
          out.appendLine("=== Free pack sync — errors ===");
          for (const err of result.errors) {
            out.appendLine(err);
          }
          out.show(true);
          void vscode.window.showWarningMessage(
            `Free pack sync finished with ${result.errors.length} error(s). See Output → Bitstream Studio.`,
            "Reveal free pack folder",
          ).then((choice) => {
            if (choice === "Reveal free pack folder") {
              void vscode.commands.executeCommand(
                "revealFileInOS",
                vscode.Uri.file(result.outputRootDir),
              );
            }
          });
          return;
        }

        await context.globalState.update(
          FREE_PACK_SYNCED_FILE_COUNT_KEY,
          result.downloaded,
        );

        const sizeLabel = formatFreePackBytes(result.totalBytes);
        const revealLabel = "Reveal free pack folder";
        const choice = await vscode.window.showInformationMessage(
          `Free pack synced: ${result.downloaded} file(s) (${sizeLabel}) → ${result.outputRootDir}`,
          revealLabel,
        );
        if (choice === revealLabel) {
          try {
            await vscode.commands.executeCommand(
              "revealFileInOS",
              vscode.Uri.file(result.outputRootDir),
            );
          } catch {
            await vscode.env.openExternal(vscode.Uri.file(result.outputRootDir));
          }
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        void vscode.window.showErrorMessage(`Free pack sync failed: ${errMsg}`);
      }
    },
  );
}
