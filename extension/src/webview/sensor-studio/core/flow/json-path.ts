/** Read nested JSON path like `payload.temp` from a parsed object. */
export function readJsonPath(root: unknown, path: string): unknown {
  if (!path.trim()) {
    return root;
  }
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = root;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function parseJsonPayload(raw: unknown): unknown {
  if (raw == null) {
    return null;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return null;
    }
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") {
    return raw;
  }
  return null;
}

export function coerceJsonPathNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export const DEFAULT_MULTIPLEXER_PATHS: Record<string, string> = {
  a: "a",
  b: "b",
  c: "c",
};

export function readMultiplexerPaths(defaultConfig: Record<string, unknown>): Record<string, string> {
  const raw = defaultConfig.paths;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_MULTIPLEXER_PATHS };
  }
  const out: Record<string, string> = { ...DEFAULT_MULTIPLEXER_PATHS };
  for (const key of Object.keys(DEFAULT_MULTIPLEXER_PATHS)) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim().length > 0) {
      out[key] = v.trim();
    }
  }
  return out;
}

export function evaluateMultiplexer(
  payload: unknown,
  paths: Record<string, string>,
): Record<string, number> {
  const root = parseJsonPayload(payload);
  const out: Record<string, number> = {};
  for (const [handleId, jsonPath] of Object.entries(paths)) {
    out[handleId] = coerceJsonPathNumber(readJsonPath(root, jsonPath));
  }
  return out;
}
