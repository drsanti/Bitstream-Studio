/**
 * Choose a COM path for UART auto-connect from user prefs (whitelist + display order).
 */

export type PickPreferredSerialPortPathInput = {
  /** Paths currently reported by the bridge/OS. */
  availablePaths: readonly string[];
  /** Persisted target (`bitstreamConfig.serialPath`). */
  preferredPath?: string;
  /** Allowed paths when non-empty; empty = no whitelist filter. */
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
 * Priority: explicit preferred (if present) → whitelisted in display order → display order → first available.
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
  if (preferred.length > 0 && availableSet.has(preferred))
  {
    return preferred;
  }

  const displayOrder = normalizeSerialPathList(input.displayOrder).filter((p) =>
    availableSet.has(p),
  );
  const whitelist = normalizeSerialPathList(input.whitelistedPaths).filter((p) =>
    availableSet.has(p),
  );

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

  if (displayOrder.length > 0)
  {
    return displayOrder[0] ?? null;
  }

  return available[0] ?? null;
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
