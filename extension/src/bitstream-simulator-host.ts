import * as vscode from "vscode";
import { startAllBackendServices } from "./backend-services";

export const BITSTREAM_SIMULATOR_START_COMMAND = "bitstreamSimulator.start";
export const BITSTREAM_SIMULATOR_STOP_COMMAND = "bitstreamSimulator.stop";

export type BitstreamSimulatorHostResult = {
  ok: boolean;
  error?: string;
};

const MISSING_EXTENSION_MESSAGE =
  "Install the bitstream-simulator VS Code extension, then retry.";

/**
 * Returns true when the external bitstream-simulator extension registered its start command.
 */
export async function isBitstreamSimulatorExtensionInstalled(): Promise<boolean>
{
  const commands = await vscode.commands.getCommands(true);
  return commands.includes(BITSTREAM_SIMULATOR_START_COMMAND);
}

/**
 * Ensure broker backends are up, then invoke bitstreamSimulator.start on the external VSIX.
 */
export async function startBitstreamSimulatorExtension(
  extensionPath: string,
  options?: { ensureBackends?: boolean },
): Promise<BitstreamSimulatorHostResult>
{
  if (!(await isBitstreamSimulatorExtensionInstalled()))
  {
    return { ok: false, error: MISSING_EXTENSION_MESSAGE };
  }

  if (options?.ensureBackends !== false)
  {
    try
    {
      await startAllBackendServices(extensionPath);
    }
    catch (error)
    {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: `Backend services failed: ${message}` };
    }
  }

  try
  {
    await vscode.commands.executeCommand(BITSTREAM_SIMULATOR_START_COMMAND);
    void vscode.window.setStatusBarMessage("Bitstream Simulator started", 3000);
    return { ok: true };
  }
  catch (error)
  {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Invoke bitstreamSimulator.stop on the external VSIX (no-op if extension missing).
 */
export async function stopBitstreamSimulatorExtension(): Promise<BitstreamSimulatorHostResult>
{
  if (!(await isBitstreamSimulatorExtensionInstalled()))
  {
    return { ok: false, error: MISSING_EXTENSION_MESSAGE };
  }

  try
  {
    await vscode.commands.executeCommand(BITSTREAM_SIMULATOR_STOP_COMMAND);
    void vscode.window.setStatusBarMessage("Bitstream Simulator stopped", 3000);
    return { ok: true };
  }
  catch (error)
  {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
