import * as vscode from "vscode";
import {
  formatFreePackStorageDiagnosisReport,
  runFreePackStorageDiagnosis,
} from "../asset-sync/diagnoseFreePackStorageReport";
import { getFreeGithubMirrorRootUri } from "../extensionAssetPaths";
import { getBitstreamStudioOutputChannel } from "./bitstreamStudioOutputChannel";

export function registerDiagnoseFreePackStorageCommand(
  context: vscode.ExtensionContext,
): vscode.Disposable {
  return vscode.commands.registerCommand(
    "bitstream-studio.diagnoseFreePackStorage",
    async () => {
      const freePackUri = getFreeGithubMirrorRootUri(context);
      const diagnosis = await runFreePackStorageDiagnosis({
        hostEditorAppName: vscode.env.appName,
        activeExtensionGlobalStorageFs: context.globalStorageUri.fsPath,
        activeExtensionFreePackRootFs: freePackUri.fsPath,
      });

      const report = formatFreePackStorageDiagnosisReport(diagnosis);
      const out = getBitstreamStudioOutputChannel();
      out.clear();
      out.appendLine(report);
      out.show(true);

      const primaryRoot =
        diagnosis.activeExtensionFreePackRootFs?.trim() || freePackUri.fsPath;
      const summary =
        diagnosis.maxFileCount === 0
          ? "Free pack folder is empty or missing. See Output → Bitstream Studio for paths."
          : `Free pack: ${diagnosis.maxFileCount} file(s) on disk. See Output → Bitstream Studio for details.`;

      const revealLabel = "Reveal free pack folder";
      const choice = await vscode.window.showInformationMessage(
        summary,
        diagnosis.maxFileCount > 0 ? revealLabel : undefined,
      );

      if (choice === revealLabel) {
        const folderUri = vscode.Uri.file(primaryRoot);
        try {
          await vscode.commands.executeCommand("revealFileInOS", folderUri);
        } catch {
          await vscode.env.openExternal(folderUri);
        }
      }
    },
  );
}
