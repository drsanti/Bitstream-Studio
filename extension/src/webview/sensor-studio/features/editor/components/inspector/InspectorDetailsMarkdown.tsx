import { TRNMarkdownRenderer } from "../../../../../ui/TRN/TRNMarkdownRenderer";

/** Compact markdown for Node Inspector **Details** cards (Specifications, catalog copy). */
const INSPECTOR_DETAILS_MARKDOWN_CLASS =
  "max-w-none text-[11px] leading-relaxed text-zinc-400 " +
  "[&_h3]:!mt-3 [&_h3]:!mb-1.5 [&_h3]:!text-[10px] [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:font-semibold [&_h3]:text-zinc-500 " +
  "[&_h3:first-child]:!mt-0 [&_p]:!my-1.5 [&_p]:text-zinc-400 [&_ul]:!my-1.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_ul]:text-zinc-400 " +
  "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_li]:leading-relaxed " +
  "[&_strong]:font-medium [&_strong]:text-zinc-200 [&_a]:text-[10px] [&_a]:font-medium [&_a]:text-sky-400/90 hover:[&_a]:text-sky-300 " +
  "[&_blockquote]:my-2 [&_blockquote]:rounded [&_blockquote]:border [&_blockquote]:border-zinc-800/70 " +
  "[&_blockquote]:bg-zinc-950/50 [&_blockquote]:px-2 [&_blockquote]:py-1.5 [&_blockquote]:text-[10px] [&_blockquote]:leading-snug " +
  "[&_table]:my-2 [&_table]:w-full [&_table]:min-w-0 [&_table]:border-collapse [&_table]:text-[10px] " +
  "[&_thead]:border-b [&_thead]:border-zinc-800/70 [&_thead]:bg-zinc-950/50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium [&_th]:text-zinc-500 " +
  "[&_tbody_tr]:border-b [&_tbody_tr]:border-zinc-800/40 [&_tbody_tr:last-child]:border-b-0 " +
  "[&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_td]:text-zinc-400 [&_th[scope=row]]:max-w-[55%] [&_th[scope=row]]:font-normal [&_th[scope=row]]:text-zinc-500 " +
  "[&_code]:rounded [&_code]:border [&_code]:border-zinc-700/80 [&_code]:bg-black/30 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[10px] [&_code]:text-zinc-300";

export type InspectorDetailsMarkdownProps = {
  markdown: string;
};

export function InspectorDetailsMarkdown(props: InspectorDetailsMarkdownProps) {
  const trimmed = props.markdown.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return (
    <TRNMarkdownRenderer
      markdown={trimmed}
      tone="neutral"
      enableZoom={false}
      enableCodeCopy={false}
      enableSyntaxHighlight={false}
      enableHtmlPreview={false}
      className={INSPECTOR_DETAILS_MARKDOWN_CLASS}
    />
  );
}
