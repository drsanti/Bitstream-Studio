import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import { findAllMatchRanges } from "./markdownEditorFindHighlight";
import {
  findMatchLength,
  findNext,
  findPrevious,
  replaceAllMatches,
  replaceRange,
  type FindQueryOptions,
  type TextRange,
} from "./markdownEditorSelection";

export function CourseMarkdownEditorFindBar({
  text,
  selection,
  onApply,
  onClose,
  onQueryStateChange,
}: {
  text: string;
  selection: TextRange;
  onApply: (nextText: string, nextSelection: TextRange) => void;
  onClose: () => void;
  onQueryStateChange?: (state: FindQueryOptions & { query: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const queryRef = useRef<HTMLInputElement>(null);

  const findOptions: FindQueryOptions = { caseSensitive, useRegex };

  const matchRanges = useMemo(
    () => (query.length > 0 ? findAllMatchRanges(text, query, findOptions) : []),
    [findOptions, query, text],
  );

  const activeMatchIndex = useMemo(() => {
    if (matchRanges.length === 0) {
      return -1;
    }
    const index = matchRanges.findIndex(
      (range) => selection.start >= range.start && selection.start < range.end,
    );
    if (index >= 0) {
      return index;
    }
    const next = matchRanges.findIndex((range) => range.start >= selection.start);
    return next >= 0 ? next : 0;
  }, [matchRanges, selection.start]);

  useEffect(() => {
    onQueryStateChange?.({ query, ...findOptions });
  }, [caseSensitive, onQueryStateChange, query, useRegex]);

  useEffect(() => {
    queryRef.current?.focus();
  }, []);

  const jumpToMatch = useCallback(
    (hit: number) => {
      if (hit === -1) {
        return;
      }
      const length = findMatchLength(text, query, hit, findOptions);
      onApply(text, { start: hit, end: hit + length });
    },
    [findOptions, onApply, query, text],
  );

  const findNextMatch = useCallback(() => {
    jumpToMatch(findNext(text, query, selection.end, findOptions));
  }, [findOptions, jumpToMatch, query, selection.end, text]);

  const findPrevMatch = useCallback(() => {
    jumpToMatch(findPrevious(text, query, selection.start, findOptions));
  }, [findOptions, jumpToMatch, query, selection.start, text]);

  const selectionMatchesQuery = useCallback(() => {
    if (query.length === 0) {
      return false;
    }
    const selected = text.slice(selection.start, selection.end);
    if (useRegex) {
      const pattern = findNext(text, query, selection.start, findOptions);
      return pattern === selection.start;
    }
    return caseSensitive
      ? selected === query
      : selected.toLowerCase() === query.toLowerCase();
  }, [caseSensitive, findOptions, query, selection, text, useRegex]);

  const replaceOne = useCallback(() => {
    if (query.length === 0) {
      return;
    }
    if (!selectionMatchesQuery()) {
      findNextMatch();
      return;
    }
    const result = replaceRange(text, selection, replacement);
    onApply(result.text, result.selection);
  }, [findNextMatch, onApply, query, replacement, selection, selectionMatchesQuery, text]);

  const replaceAll = useCallback(() => {
    if (query.length === 0) {
      return;
    }
    const next = replaceAllMatches(text, query, replacement, findOptions);
    onApply(next, { start: 0, end: 0 });
  }, [findOptions, onApply, query, replacement, text]);

  return (
    <div className="course-md-editor-find flex flex-wrap items-end gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-panel)] px-2 py-2">
      <TRNFormField id="course-md-find-query" label="Find" className="min-w-[10rem] flex-1">
        <TRNInput
          ref={queryRef}
          id="course-md-find-query"
          variant="outlined"
          size="sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (event.shiftKey) {
                findPrevMatch();
              } else {
                findNextMatch();
              }
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
        />
      </TRNFormField>
      <TRNFormField id="course-md-find-replace" label="Replace" className="min-w-[10rem] flex-1">
        <TRNInput
          id="course-md-find-replace"
          variant="outlined"
          size="sm"
          value={replacement}
          onChange={(event) => setReplacement(event.target.value)}
        />
      </TRNFormField>
      <div className="flex min-w-[9rem] flex-col gap-1 pb-0.5">
        <TRNInlineToggleRow
          label="Match case"
          checked={caseSensitive}
          onCheckedChange={setCaseSensitive}
          ariaLabel="Match case when finding text"
        />
        <TRNInlineToggleRow
          label="Regex"
          hint="Treat the find query as a regular expression."
          checked={useRegex}
          onCheckedChange={setUseRegex}
          ariaLabel="Use regular expression for find"
        />
      </div>
      {query.length > 0 ? (
        <span className="pb-1 text-[10px] text-[var(--text-muted)]">
          {matchRanges.length === 0
            ? "No matches"
            : `${activeMatchIndex + 1} / ${matchRanges.length}`}
        </span>
      ) : null}
      <div className="flex flex-wrap gap-1 pb-0.5">
        <TRNButton size="compact" onClick={findNextMatch}>
          Next
        </TRNButton>
        <TRNButton size="compact" onClick={findPrevMatch}>
          Prev
        </TRNButton>
        <TRNButton size="compact" onClick={replaceOne}>
          Replace
        </TRNButton>
        <TRNButton size="compact" onClick={replaceAll}>
          All
        </TRNButton>
        <TRNButton size="compact" onClick={onClose}>
          Close
        </TRNButton>
      </div>
    </div>
  );
}
