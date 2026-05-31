/**
 * Choose a COM path for UART auto-connect from user prefs (whitelist + display order).
 *
 * AUTO toggle ON adds a path to `whitelistedPaths`; OFF removes it (implicit blacklist).
 * When the whitelist is non-empty, only whitelisted paths may be auto-selected.
 * When the whitelist is empty, auto-connect does not pick a port unless `preferredPath` is set (manual target / star).
 */

export type PickPreferredSerialPortPathInput = {
  /** Paths currently reported by the bridge/OS. */
  availablePaths: readonly string[];
  /** Persisted target (`bitstreamConfig.serialPath`). */
  preferredPath?: string;
  /** AUTO-on paths; empty means no whitelist filter for auto (only explicit preferred). */
  whitelistedPaths: readonly string[];
  /** User drag-order (paths only). */
  displayOrder: readonly string[];
};

/** Normalize path list: trim, dedupe, keep first occurrence. */
export function normalizeSerialPathList(paths: readonly string[]): string[]
{
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of paths)
  {
    const path = raw.trim();
    if (path.length === 0 || seen.has(path))
    {
      continue;
    }
    seen.add(path);
    out.push(path);
  }
  return out;
}

/**
 * Resolve which COM path to open.
 * Priority when whitelist non-empty: preferred (if whitelisted) → whitelisted in display order → first whitelisted.
 * When whitelist empty: only explicit preferred (active UART target); no auto pick from other ports.
 */
export function pickPreferredSerialPortPath(input: PickPreferredSerialPortPathInput): string | null
{
  const available = normalizeSerialPathList(input.availablePaths);
  if (available.length === 0)
  {
    return null;
  }

  const availableSet = new Set(available);
  const preferred = input.preferredPath?.trim() ?? "";
  const displayOrder = normalizeSerialPathList(input.displayOrder).filter((p) =>
    availableSet.has(p),
  );
  const whitelist = normalizeSerialPathList(input.whitelistedPaths).filter((p) =>
    availableSet.has(p),
  );

  if (preferred.length > 0 && availableSet.has(preferred))
  {
    if (whitelist.length === 0 || whitelist.includes(preferred))
    {
      return preferred;
    }
  }

  if (whitelist.length > 0)
  {
    for (const path of displayOrder)
    {
      if (whitelist.includes(path))
      {
        return path;
      }
    }
    return whitelist[0] ?? null;
  }

  return null;
}

/** True when path is allowed for connect (AUTO on, or explicit preferred with empty whitelist). */
export function isSerialPathAllowedForConnect(
  path: string,
  availablePaths: readonly string[],
  preferredPath: string,
  whitelistedPaths: readonly string[],
): boolean {
  const normalized = path.trim();
  if (normalized.length === 0) {
    return false;
  }
  const pick = pickPreferredSerialPortPath({
    availablePaths,
    preferredPath: preferredPath.trim() || normalized,
    whitelistedPaths,
    displayOrder: [],
  });
  return pick === normalized;
}

/** Order port rows: `displayOrder` first, then remaining paths alphabetically. */
export function orderSerialPortsForDisplay<T extends { path: string }>(
  ports: readonly T[],
  displayOrder: readonly string[],
): T[]
{
  const byPath = new Map(ports.map((p) => [p.path, p] as const));
  const ordered: T[] = [];
  const seen = new Set<string>();

  for (const raw of displayOrder)
  {
    const path = raw.trim();
    const port = byPath.get(path);
    if (port != null && !seen.has(path))
    {
      seen.add(path);
      ordered.push(port);
    }
  }

  const rest = ports
    .filter((p) => !seen.has(p.path))
    .slice()
    .sort((a, b) => a.path.localeCompare(b.path));

  return [...ordered, ...rest];
}
