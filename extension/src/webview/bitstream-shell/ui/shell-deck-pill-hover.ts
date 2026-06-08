/** Base class — pair with accent modifier; loads styles from `shell-control-deck.css`. */
export const SHELL_DECK_PILL_INTERACTIVE_CLASS = "shell-deck-pill";

export const SHELL_DECK_PILL_HOVER = {
  workspaceTelemetry: "shell-deck-pill--ws-telemetry",
  workspaceStudio: "shell-deck-pill--ws-studio",
  workspacePresentation: "shell-deck-pill--ws-presentation",
  sourceHardware: "shell-deck-pill--src-hardware",
  sourceSimulator: "shell-deck-pill--src-simulator",
  sourceSimulatorOffline: "shell-deck-pill--src-simulator-offline",
  serviceConnect: "shell-deck-pill--service-connect",
  serviceDisconnect: "shell-deck-pill--service-disconnect",
  serviceConnecting: "shell-deck-pill--service-connecting",
} as const;
