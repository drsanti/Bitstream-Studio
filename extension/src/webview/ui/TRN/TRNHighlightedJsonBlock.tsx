import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { twMerge } from "tailwind-merge";
import {
  TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID,
  TRN_HIGHLIGHTED_JSON_PRISM_STYLES,
  type TRNHighlightedJsonSyntaxThemeId,
} from "./trnHighlightedJsonSyntaxThemes.js";

/** Matches `TRNMarkdownRenderer` / `TRNHighlightedJsonTextarea` monospace metrics. */
const TRN_CODE_FONT_FAMILY =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export type TRNHighlightedJsonBlockProps = {
  /** Pretty-printed JSON string (e.g. `JSON.stringify(obj, null, 2)`). */
  value: string;
  className?: string;
  /** When empty, renders a single space so Prism layout stays stable. */
  emptyPlaceholder?: string;
  /** Prism theme for syntax colors (default One Dark). */
  syntaxThemeId?: TRNHighlightedJsonSyntaxThemeId;
};

/**
 * Read-only JSON with Prism highlighting — same stack as fenced ```json``` blocks in `TRNMarkdownRenderer`.
 */
export function TRNHighlightedJsonBlock(props: TRNHighlightedJsonBlockProps) {
  const {
    value,
    className,
    emptyPlaceholder = " ",
    syntaxThemeId = TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID,
  } = props;
  const source = value.length === 0 ? emptyPlaceholder : value;
  const prismStyle = TRN_HIGHLIGHTED_JSON_PRISM_STYLES[syntaxThemeId];

  return (
    <div
      className={twMerge(
        "overflow-auto rounded border border-white/10 bg-black/40 px-2 py-1",
        className,
      )}
    >
      <SyntaxHighlighter
        language="json"
        style={prismStyle}
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
        {source}
      </SyntaxHighlighter>
    </div>
  );
}
