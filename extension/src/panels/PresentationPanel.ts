import * as vscode from "vscode";
import { TernionDigitalTwin } from "./TernionDigitalTwin";

/**
 * PresentationPanel — second VS Code webview column for instructor slides.
 * Uses the same Bitstream Studio bundle as the main shell with workspace=presentation.
 */
export class PresentationPanel {
  public static createOrShow(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
  ): void {
    TernionDigitalTwin.createPresentationPanelOrShow(extensionUri, context);
  }

  public static get currentPanel(): TernionDigitalTwin | undefined {
    return TernionDigitalTwin.presentationPanel;
  }
}
