/** Parse / compose **`mcuBaseUrl`** for Connection UI (scheme + host + optional port). */

export type McuHttpScheme = "http" | "https";

export type ParsedMcuConnection = {
  scheme: McuHttpScheme;
  /** Hostname or IPv4 / IPv6 literal (no brackets). */
  host: string;
  /** Port digits only, or empty when omitted (default 80 / 443). */
  port: string;
};

const DEFAULT_HOST = "192.168.4.1";

export function parseMcuConnection(baseUrl: string): ParsedMcuConnection {
  try {
    const u = new URL(baseUrl.trim());
    const scheme: McuHttpScheme = u.protocol === "https:" ? "https" : "http";
    const host = u.hostname || DEFAULT_HOST;
    const port = u.port ?? "";
    return { scheme, host, port };
  } catch {
    return { scheme: "http", host: DEFAULT_HOST, port: "" };
  }
}

export function composeMcuConnection(parts: ParsedMcuConnection): string {
  const scheme: McuHttpScheme = parts.scheme === "https" ? "https" : "http";
  const host = parts.host.trim() || DEFAULT_HOST;
  const portRaw = parts.port.trim().replace(/\s+/g, "");

  if (portRaw === "") {
    return `${scheme}://${host}`;
  }

  const n = parseInt(portRaw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    return `${scheme}://${host}`;
  }

  const defaultPort = scheme === "https" ? 443 : 80;
  if (n === defaultPort) {
    return `${scheme}://${host}`;
  }

  return `${scheme}://${host}:${n}`;
}
