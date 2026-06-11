const FOLLOW_STAGE_PICK_KEY = "ternion.sensor-studio.stageOutliner.followStagePick.v1";
const HIDDEN_KEYS_KEY = "ternion.sensor-studio.stageOutliner.hiddenKeys.v1";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function readStoredStageOutlinerFollowStagePick(): boolean {
  return safeGet(FOLLOW_STAGE_PICK_KEY) === "1";
}

export function writeStoredStageOutlinerFollowStagePick(next: boolean): void {
  safeSet(FOLLOW_STAGE_PICK_KEY, next ? "1" : "0");
}

export function readStoredStageOutlinerHiddenKeys(): string[] {
  const raw = safeGet(HIDDEN_KEYS_KEY);
  if (raw == null || raw.trim().length === 0) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((k): k is string => typeof k === "string" && k.trim().length > 0);
  } catch {
    return [];
  }
}

export function writeStoredStageOutlinerHiddenKeys(keys: readonly string[]): void {
  safeSet(HIDDEN_KEYS_KEY, JSON.stringify([...keys]));
}
