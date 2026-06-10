export const TRN_EMOJI_CATEGORIES = ["smileys", "gestures", "objects", "symbols"] as const;

export type TrnEmojiCategory = (typeof TRN_EMOJI_CATEGORIES)[number];

export type TrnEmojiCatalogEntry = {
  emoji: string;
  name: string;
  keywords?: string[];
};

export const TRN_EMOJI_CATEGORY_LABELS: Record<TrnEmojiCategory, string> = {
  smileys: "Smileys",
  gestures: "Gestures",
  objects: "Objects",
  symbols: "Symbols",
};

export const TRN_EMOJI_CATALOG: Record<TrnEmojiCategory, TrnEmojiCatalogEntry[]> = {
  smileys: [
    { emoji: "😀", name: "Grinning", keywords: ["happy", "smile"] },
    { emoji: "🙂", name: "Slight smile", keywords: ["smile"] },
    { emoji: "😉", name: "Wink", keywords: ["wink"] },
    { emoji: "😊", name: "Smiling eyes", keywords: ["warm", "happy"] },
    { emoji: "😎", name: "Sunglasses", keywords: ["cool"] },
    { emoji: "🤔", name: "Thinking", keywords: ["think", "hmm"] },
    { emoji: "😅", name: "Relieved sweat", keywords: ["nervous"] },
    { emoji: "🤩", name: "Star eyes", keywords: ["wow", "excited"] },
    { emoji: "😴", name: "Sleeping", keywords: ["sleep", "idle"] },
    { emoji: "🥳", name: "Party", keywords: ["celebrate"] },
  ],
  gestures: [
    { emoji: "👍", name: "Thumbs up", keywords: ["ok", "yes", "good"] },
    { emoji: "👎", name: "Thumbs down", keywords: ["no", "bad"] },
    { emoji: "👏", name: "Clap", keywords: ["applause"] },
    { emoji: "🙌", name: "Raised hands", keywords: ["celebrate"] },
    { emoji: "👉", name: "Point right", keywords: ["next", "step"] },
    { emoji: "👈", name: "Point left", keywords: ["back"] },
    { emoji: "👆", name: "Point up", keywords: ["above"] },
    { emoji: "✅", name: "Check mark", keywords: ["done", "pass", "ok"] },
    { emoji: "❌", name: "Cross mark", keywords: ["fail", "no"] },
    { emoji: "⚠️", name: "Warning", keywords: ["caution", "alert"] },
    { emoji: "💡", name: "Light bulb", keywords: ["tip", "idea"] },
    { emoji: "🔥", name: "Fire", keywords: ["hot", "trend"] },
  ],
  objects: [
    { emoji: "📊", name: "Bar chart", keywords: ["chart", "data", "metric"] },
    { emoji: "📈", name: "Trend up", keywords: ["growth", "chart"] },
    { emoji: "📉", name: "Trend down", keywords: ["drop", "chart"] },
    { emoji: "📡", name: "Satellite", keywords: ["telemetry", "signal", "radio"] },
    { emoji: "🛰️", name: "Orbiting satellite", keywords: ["space", "telemetry"] },
    { emoji: "🔧", name: "Wrench", keywords: ["tool", "fix", "config"] },
    { emoji: "⚙️", name: "Gear", keywords: ["settings", "mechanical"] },
    { emoji: "🖥️", name: "Desktop", keywords: ["computer", "dashboard"] },
    { emoji: "📱", name: "Mobile phone", keywords: ["device"] },
    { emoji: "🔬", name: "Microscope", keywords: ["lab", "science", "sensor"] },
    { emoji: "🧪", name: "Test tube", keywords: ["lab", "experiment"] },
    { emoji: "🔋", name: "Battery", keywords: ["power", "energy"] },
    { emoji: "🧭", name: "Compass", keywords: ["orientation", "navigation"] },
    { emoji: "🎯", name: "Target", keywords: ["goal", "aim"] },
  ],
  symbols: [
    { emoji: "→", name: "Right arrow", keywords: ["next", "flow"] },
    { emoji: "←", name: "Left arrow", keywords: ["back"] },
    { emoji: "↔", name: "Left right arrow", keywords: ["bidirectional"] },
    { emoji: "•", name: "Bullet", keywords: ["list"] },
    { emoji: "✓", name: "Check", keywords: ["done"] },
    { emoji: "✗", name: "Ballot X", keywords: ["no"] },
    { emoji: "★", name: "Star", keywords: ["favorite"] },
    { emoji: "☆", name: "Outline star", keywords: ["star"] },
    { emoji: "±", name: "Plus minus", keywords: ["tolerance"] },
    { emoji: "°", name: "Degree", keywords: ["angle", "temperature"] },
    { emoji: "∞", name: "Infinity", keywords: ["continuous"] },
    { emoji: "≈", name: "Approximately", keywords: ["about"] },
  ],
};

const FLAT_CATALOG = TRN_EMOJI_CATEGORIES.flatMap((category) =>
  TRN_EMOJI_CATALOG[category].map((entry) => ({ ...entry, category })),
);

export function searchTrnEmojiCatalog(query: string): TrnEmojiCatalogEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) {
    return [];
  }
  return FLAT_CATALOG.filter((entry) => {
    if (entry.emoji.includes(trimmed)) {
      return true;
    }
    if (entry.name.toLowerCase().includes(trimmed)) {
      return true;
    }
    return entry.keywords?.some((keyword) => keyword.includes(trimmed)) ?? false;
  });
}

export function findTrnEmojiName(emoji: string): string {
  const match = FLAT_CATALOG.find((entry) => entry.emoji === emoji);
  return match?.name ?? "Emoji";
}
