/*******************************************************************************
 * File Name : bitstream-attach-cli.ts
 *
 * Description : Shared CLI/env parsing and serial port selection for MCP and probes.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BITSTREAM_DEFAULT_BAUD_RATE } from "../bitstream-default-baud";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import type { PortInfo } from "../../serialport-bridge/protocol";
import { listSerialPortDetails } from "../services/serial-port-details-service";
import { getSerialPortStatus } from "../services/serial-port-status-service";

export interface BitstreamAttachCliOptions
{
  wsUrl: string;
  path?: string;
  autoDetectPort: boolean;
  allowManufacturers: string[];
  denyPatterns: string[];
  baudRate: number;
  mode: "data" | "line" | "both";
}

export function getArgFromArgv(argv: string[], name: string): string | undefined
{
  const prefix = `--${name}=`;
  for (const arg of argv)
  {
    if (arg.startsWith(prefix))
    {
      return arg.slice(prefix.length);
    }
  }
  return undefined;
}

/**
 * Parses MCP-compatible CLI/env for opening a BS2 broker session over WebSocket + serialport/*.
 */
export function parseBitstreamAttachCliOptions(
  argv: string[] = process.argv.slice(2),
  overrides?: { wsUrl?: string },
): BitstreamAttachCliOptions
{
  const getArg = (name: string) => getArgFromArgv(argv, name);
  const wsUrl =
    overrides?.wsUrl ??
    getArg("serial-url") ??
    getArg("url") ??
    process.env.T3D_WS_CLIENT_URL ??
    T3D_DEFAULT_WS_CLIENT_URL;
  const path = getArg("serialPath") ?? getArg("path") ?? process.env.BITSTREAM_SERIAL_PATH;
  const autoDetectArg = getArg("autoDetectPort") ?? process.env.BITSTREAM_AUTO_DETECT_PORT ?? "true";
  const autoDetectPort = autoDetectArg.toLowerCase() !== "false";
  const allowManufacturers = (
    getArg("allowManufacturer") ??
    process.env.BITSTREAM_ALLOW_MANUFACTURER ??
    ""
  )
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  const denyPatterns = (
    getArg("denyPattern") ??
    process.env.BITSTREAM_DENY_PATTERN ??
    "bluetooth,rfcomm,bth"
  )
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.length > 0);
  const baudRate = Number(
    getArg("baudRate") ?? process.env.BITSTREAM_BAUD_RATE ?? String(BITSTREAM_DEFAULT_BAUD_RATE),
  );
  const modeArg = getArg("mode") ?? process.env.BITSTREAM_MODE ?? "data";
  const mode = modeArg === "line" || modeArg === "both" ? modeArg : "data";
  return { wsUrl, path, autoDetectPort, allowManufacturers, denyPatterns, baudRate, mode };
}

function isDeniedByPattern(port: PortInfo, denyPatterns: string[]): boolean
{
  const text =
    `${port.path ?? ""} ${port.manufacturer ?? ""} ${port.pnpId ?? ""} ${port.locationId ?? ""}`.toLowerCase();
  return denyPatterns.some((pattern) => text.includes(pattern));
}

function isAllowedByManufacturer(port: PortInfo, allowManufacturers: string[]): boolean
{
  if (allowManufacturers.length === 0)
  {
    return true;
  }
  const manufacturer = (port.manufacturer ?? "").toLowerCase();
  return allowManufacturers.some((allowed) => manufacturer.includes(allowed.toLowerCase()));
}

function rankPort(port: PortInfo): number
{
  const text =
    `${port.manufacturer ?? ""} ${port.pnpId ?? ""} ${port.vendorId ?? ""} ${port.productId ?? ""}`.toLowerCase();
  if (text.includes("st") || text.includes("stm") || text.includes("silabs") || text.includes("ftdi"))
  {
    return 0;
  }
  return 1;
}

export async function discoverActiveBrokerSerialPath(
  wsUrl: string,
  timeoutMs = 900,
): Promise<{ path: string; baudRate: number } | null>
{
  try
  {
    const st = await getSerialPortStatus({ wsUrl, timeoutMs });
    if (st?.isOpen && st.path && st.baudRate)
    {
      return { path: st.path, baudRate: st.baudRate };
    }
  }
  catch
  {
    // ignore discovery failures
  }
  return null;
}

export async function autoDetectBrokerSerialPath(
  wsUrl: string,
  allowManufacturers: string[],
  denyPatterns: string[],
): Promise<string | null>
{
  const ports = await listSerialPortDetails({ wsUrl, timeoutMs: 4000 });
  const candidates = ports
    .filter((port) => !isDeniedByPattern(port, denyPatterns))
    .filter((port) => isAllowedByManufacturer(port, allowManufacturers))
    .sort((a, b) => rankPort(a) - rankPort(b));
  for (const candidate of candidates)
  {
    if (candidate.path)
    {
      return candidate.path;
    }
  }
  return null;
}

/**
 * Resolve path/baud from CLI, active broker status, or auto-detect list (no session open).
 */
export async function resolveBitstreamAttachTarget(
  options: BitstreamAttachCliOptions,
  logPrefix = "[bitstream-attach]",
): Promise<BitstreamAttachCliOptions | null>
{
  const effective: BitstreamAttachCliOptions = { ...options, path: options.path ?? undefined };

  if (!effective.path)
  {
    const active = await discoverActiveBrokerSerialPath(effective.wsUrl);
    if (active)
    {
      effective.path = active.path;
      effective.baudRate = active.baudRate;
      console.error(
        `${logPrefix} discovered active broker serial status: path=${active.path} baudRate=${active.baudRate}`,
      );
    }
  }

  if (effective.path)
  {
    return effective;
  }

  if (effective.autoDetectPort)
  {
    const path = await autoDetectBrokerSerialPath(
      effective.wsUrl,
      effective.allowManufacturers,
      effective.denyPatterns,
    );
    if (path)
    {
      effective.path = path;
      return effective;
    }
    console.error(
      `${logPrefix} auto-detect found no broker candidate. Use --path=<COMx> for manual override.`,
    );
    return null;
  }

  console.error(
    `${logPrefix} no serial port selected. Provide --path=<serialPort> or enable auto-detect.`,
  );
  return null;
}
