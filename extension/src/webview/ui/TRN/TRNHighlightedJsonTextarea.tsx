import { useCallback, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { twMerge } from "tailwind-merge";

/** Matches `TRNMarkdownRenderer` fenced blocks for consistent monospace metrics. */
const TRN_CODE_FONT_FAMILY =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export type TRNHighlightedJsonTextareaProps = {
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * JSON field with Prism highlighting (`react-syntax-highlighter`), aligned with markdown code blocks.
 * Uses a transparent textarea over the highlighted layer; scroll positions stay synced.
 */
export function TRNHighlightedJsonTextarea(props: TRNHighlightedJsonTextareaProps) {
  const {
    value,
    onChange,
    onBlur,
    disabled = false,
    className,
    "aria-label": ariaLabel,
  } = props;

  const backingRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback((source: HTMLTextAreaElement) => {
    const backing = backingRef.current;
    if (backing == null) {
      return;
    }
    backing.scrollTop = source.scrollTop;
    backing.scrollLeft = source.scrollLeft;
  }, []);

  const highlightSource = value.length === 0 ? " " : value;

  return (
    <div
      className={twMerge(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-zinc-700/80 bg-zinc-900/60 focus-within:border-cyan-400/60",
        disabled ? "opacity-60" : "",
        className,
      )}
    >
      <div
        ref={backingRef}
        className="scrollbar-hide pointer-events-none absolute inset-0 overflow-auto px-2 py-1"
        aria-hidden
      >
        <SyntaxHighlighter
          language="json"
          style={oneDark}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: 0,
            background: "transparent",
          }}
          codeTagProps={{
            style: {
              fontFamily: TRN_CODE_FONT_FAMILY,
              fontSize: "11px",
              lineHeight: "1.35",
              whiteSpace: "pre",
              overflowWrap: "normal",
            },
          }}
        >
          {highlightSource}
        </SyntaxHighlighter>
      </div>

      <textarea
        aria-label={ariaLabel}
        disabled={disabled}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onScroll={(event) => syncScroll(event.currentTarget)}
        className={
          "relative z-10 min-h-0 w-full flex-1 resize-none overflow-auto bg-transparent px-2 py-1 font-mono text-[11px] leading-[1.35] " +
          "whitespace-pre text-transparent caret-zinc-100 outline-none " +
          "selection:bg-cyan-500/30 selection:text-transparent " +
          "disabled:cursor-not-allowed"
        }
        style={{
          fontFamily: TRN_CODE_FONT_FAMILY,
          tabSize: 2,
        }}
      />
    </div>
  );
}
