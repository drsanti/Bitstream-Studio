const TRN_EMOJI_RECENT_STORAGE_KEY = "course-studio:emoji-recent-v1";
const TRN_EMOJI_RECENT_MAX = 8;

export function loadTrnEmojiRecent(): string[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(TRN_EMOJI_RECENT_STORAGE_KEY);
    if (raw == null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === "string").slice(0, TRN_EMOJI_RECENT_MAX);
  } catch {
    return [];
  }
}

export function rememberTrnEmoji(emoji: string): string[] {
  const trimmed = emoji.trim();
  if (trimmed.length === 0) {
    return loadTrnEmojiRecent();
  }
  const next = [trimmed, ...loadTrnEmojiRecent().filter((entry) => entry !== trimmed)].slice(
    0,
    TRN_EMOJI_RECENT_MAX,
  );
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(TRN_EMOJI_RECENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
  return next;
}
