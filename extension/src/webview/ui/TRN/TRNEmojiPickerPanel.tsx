import { useMemo, useState } from "react";
import { TRNInput } from "./TRNInput";
import { TRNMenuPanel } from "./TRNMenu";
import {
  TRN_EMOJI_CATEGORIES,
  TRN_EMOJI_CATALOG,
  TRN_EMOJI_CATEGORY_LABELS,
  findTrnEmojiName,
  searchTrnEmojiCatalog,
  type TrnEmojiCategory,
} from "./trnEmojiCatalog";
import { loadTrnEmojiRecent } from "./trnEmojiRecent";

export function TRNEmojiPickerPanel({
  onPick,
  className,
}: {
  onPick: (emoji: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TrnEmojiCategory>("smileys");
  const recent = useMemo(() => loadTrnEmojiRecent(), [query, category]);

  const searchResults = useMemo(() => searchTrnEmojiCatalog(query), [query]);
  const showSearch = query.trim().length > 0;
  const visibleEntries = showSearch ? searchResults : TRN_EMOJI_CATALOG[category];

  return (
    <TRNMenuPanel
      tone="glass-dropdown"
      className={`flex max-h-full w-[17.5rem] flex-col p-2 scrollbar-hide ${className ?? ""}`}
    >
      <div className="mb-2 text-[11px] font-medium text-zinc-200">Insert emoji</div>
      <TRNInput
        value={query}
        aria-label="Search emoji"
        placeholder="Search…"
        variant="field"
        size="sm"
        className="w-full"
        onChange={(event) => setQuery(event.target.value)}
      />

      {!showSearch && recent.length > 0 ? (
        <div className="mt-2">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Recent
          </div>
          <EmojiGrid
            entries={recent.map((emoji) => ({ emoji, name: findTrnEmojiName(emoji) }))}
            onPick={onPick}
          />
        </div>
      ) : null}

      {!showSearch ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {TRN_EMOJI_CATEGORIES.map((entry) => (
            <button
              key={entry}
              type="button"
              className={`rounded-md px-2 py-0.5 text-[10px] ${
                entry === category
                  ? "bg-white/12 text-zinc-100"
                  : "text-zinc-400 hover:bg-white/8 hover:text-zinc-200"
              }`}
              onClick={() => setCategory(entry)}
            >
              {TRN_EMOJI_CATEGORY_LABELS[entry]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto scrollbar-hide">
        {visibleEntries.length > 0 ? (
          <EmojiGrid entries={visibleEntries} onPick={onPick} />
        ) : (
          <div className="px-1 py-3 text-center text-[11px] text-zinc-500">No matches</div>
        )}
      </div>
    </TRNMenuPanel>
  );
}

function EmojiGrid({
  entries,
  onPick,
}: {
  entries: ReadonlyArray<{ emoji: string; name: string }>;
  onPick: (emoji: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-0.5">
      {entries.map((entry) => (
        <button
          key={`${entry.name}-${entry.emoji}`}
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none hover:bg-white/10"
          aria-label={entry.name}
          onClick={() => onPick(entry.emoji)}
        >
          {entry.emoji}
        </button>
      ))}
    </div>
  );
}
