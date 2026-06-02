import { BitstreamShellMain } from "./BitstreamShellMain";

/**
 * Standalone Bitstream app root with two tabs:
 * - Sensor Telemetry
 * - Sensor Studio
 *
 * Can be mounted directly as `<BitstreamApp />` without the webview launcher/shell.
 * Workspace is chosen on the dev landing page or via persisted host / URL / localStorage
 * ({@link readInitialBitstreamWorkspace} at store init) — do not reset here on mount.
 */
export function BitstreamApp()
{
  return <BitstreamShellMain />;
}

