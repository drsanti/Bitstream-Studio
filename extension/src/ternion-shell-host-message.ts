export type BitstreamWorkspaceHostId = "sensor-telemetry" | "telemetry" | "sensor-studio";

/** Host → webview: in-panel navigation (workspace switch while Bitstream is open). */
export type TernionShellNavigateHostMessage = {
  type: "ternion-shell-navigate";
  workspace: BitstreamWorkspaceHostId;
};

/** Host → webview: toggle Quick Action palette (Ctrl+/ from VS Code keybinding). */
export type TernionQuickActionToggleHostMessage = {
  type: "ternion-quick-action-toggle";
};

export type TernionShellHostToWebviewMessage =
  | TernionShellNavigateHostMessage
  | TernionQuickActionToggleHostMessage;
