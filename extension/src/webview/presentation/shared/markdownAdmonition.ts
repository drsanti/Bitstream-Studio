import type { PresentationCalloutVariant } from "../components/callout-tokens";

export type MarkdownAdmonitionV1 = {
  variant: PresentationCalloutVariant;
  title: string;
  body: string;
};

const ADMONITION_LABELS: Record<string, PresentationCalloutVariant> = {
  note: "info",
  info: "info",
  warning: "warning",
  caution: "warning",
  danger: "danger",
  important: "danger",
  tip: "tip",
  hint: "tip",
};

export function parseMarkdownAdmonition(raw: string): MarkdownAdmonitionV1 | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^\*\*(.+?):\*\*\s*([\s\S]*)$/);
  if (match == null) {
    return null;
  }
  const labelKey = match[1].trim().toLowerCase();
  const variant = ADMONITION_LABELS[labelKey];
  if (variant == null) {
    return null;
  }
  const body = match[2].trim();
  return {
    variant,
    title: match[1].trim(),
    body: body.length > 0 ? body : match[1].trim(),
  };
}
