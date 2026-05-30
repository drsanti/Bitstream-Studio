import React from "react";
import { WebviewRuntimeInstaller } from "../runtime/WebviewRuntimeInstaller";
import {
  readInitialBitstreamWorkspace,
  useBitstreamWorkspaceModeStore,
} from "../bitstream-app/state/bitstreamWorkspaceMode.store";
import { BitstreamShellMain } from "./BitstreamShellMain";

/**
 * Standalone Bitstream app root with two tabs:
 * - Sensor Telemetry
 * - Sensor Studio
 *
 * Can be mounted directly as `<BitstreamApp />` without the webview launcher/shell.
 */
export function BitstreamApp()
{
  React.useEffect(() => {
    useBitstreamWorkspaceModeStore.setState({ workspace: readInitialBitstreamWorkspace() });
  }, []);

  return (
    <>
      <WebviewRuntimeInstaller />
      <BitstreamShellMain />
    </>
  );
}

