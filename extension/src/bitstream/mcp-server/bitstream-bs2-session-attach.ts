/*******************************************************************************
 * File Name : bitstream-bs2-session-attach.ts
 *
 * Description : Open a BS2 broker session (HELLO probe) for MCP / AI bridge entrypoints.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Bs2BrokerSession } from "../../bitstream2/bridge/bs2-broker-session";
import {
  autoDetectBrokerSerialPath,
  discoverActiveBrokerSerialPath,
  parseBitstreamAttachCliOptions,
  type BitstreamAttachCliOptions,
} from "./bitstream-attach-cli";

export type { BitstreamAttachCliOptions };
export { getArgFromArgv, parseBitstreamAttachCliOptions } from "./bitstream-attach-cli";

export type OpenBitstreamBs2SessionResult = {
  session: Bs2BrokerSession;
  effectiveOptions: BitstreamAttachCliOptions;
};

async function tryConnectBs2AtPath(
  wsUrl: string,
  path: string,
  baudRate: number,
  logPrefix: string,
): Promise<Bs2BrokerSession | null>
{
  const session = new Bs2BrokerSession({
    wsUrl,
    path,
    baudRate,
    clientIdentityRole: "bitstream-mcp",
  });
  try
  {
    await session.connect();
    console.error(
      `${logPrefix} BS2 attach OK path=${path} baudRate=${baudRate} wsUrl=${wsUrl} (broker serialport/* only)`,
    );
    return session;
  }
  catch (error)
  {
    console.error(`${logPrefix} BS2 attach failed for ${path}:`, error);
    try
    {
      await session.disconnect();
    }
    catch
    {
      // ignore cleanup
    }
    return null;
  }
}

/**
 * Opens a {@link Bs2BrokerSession}: explicit path first, else auto-detect with HELLO verification.
 */
export async function openBitstreamBs2SessionFromCliOptions(
  options: BitstreamAttachCliOptions,
  logPrefix = "[bitstream-mcp]",
): Promise<OpenBitstreamBs2SessionResult | null>
{
  const effectiveOptions: BitstreamAttachCliOptions = { ...options, path: options.path ?? undefined };

  if (!effectiveOptions.path)
  {
    const active = await discoverActiveBrokerSerialPath(effectiveOptions.wsUrl);
    if (active)
    {
      effectiveOptions.path = active.path;
      effectiveOptions.baudRate = active.baudRate;
      console.error(
        `${logPrefix} reusing active broker serial path=${active.path} baudRate=${active.baudRate}`,
      );
    }
  }

  if (effectiveOptions.path)
  {
    const session = await tryConnectBs2AtPath(
      effectiveOptions.wsUrl,
      effectiveOptions.path,
      effectiveOptions.baudRate,
      logPrefix,
    );
    if (session)
    {
      return { session, effectiveOptions };
    }
    return null;
  }

  if (!effectiveOptions.autoDetectPort)
  {
    console.error(`${logPrefix} no serial path; auto-detect disabled.`);
    return null;
  }

  const ports = await autoDetectBrokerSerialPath(
    effectiveOptions.wsUrl,
    effectiveOptions.allowManufacturers,
    effectiveOptions.denyPatterns,
  );
  if (!ports)
  {
    console.error(`${logPrefix} auto-detect: no candidate ports listed.`);
    return null;
  }

  const session = await tryConnectBs2AtPath(
    effectiveOptions.wsUrl,
    ports,
    effectiveOptions.baudRate,
    logPrefix,
  );
  if (session)
  {
    effectiveOptions.path = ports;
    return { session, effectiveOptions };
  }

  console.error(
    `${logPrefix} auto-detect: no HELLO-verified port. Set --path=<COMx> explicitly.`,
  );
  return null;
}
