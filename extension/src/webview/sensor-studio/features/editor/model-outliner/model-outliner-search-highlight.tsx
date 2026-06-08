import type { ReactNode } from "react";

export function modelOutlinerSearchMatches(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return true;
  }
  return text.toLowerCase().includes(q);
}

/** Highlights the first case-insensitive match in `text` (for outliner row labels). */
export function ModelOutlinerSearchHighlight(props: { text: string; query: string }): ReactNode {
  const { text, query } = props;
  const q = query.trim();
  if (q.length === 0) {
    return text;
  }
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const index = lower.indexOf(needle);
  if (index < 0) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-cyan-500/20 text-cyan-100">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}
