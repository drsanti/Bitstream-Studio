import { useState, type MouseEvent } from "react";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { twMerge } from "tailwind-merge";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import {
  TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID,
  TRN_HIGHLIGHTED_JSON_PRISM_STYLES,
  type TRNHighlightedJsonSyntaxThemeId,
} from "../../ui/TRN/trnHighlightedJsonSyntaxThemes";
import { writeClipboardText } from "../../ui/utils/clipboard";

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  py: "python",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  rs: "rust",
};

const CODE_FONT_FAMILY =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export function normalizePrismLanguage(language: string | null | undefined): string {
  if (language == null || language.length === 0) {
    return "text";
  }
  const lower = language.toLowerCase();
  return LANGUAGE_ALIASES[lower] ?? lower;
}

export function PresentationFencedCodeBlock({
  code,
  language,
  syntaxThemeId = TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID,
  className,
  onClick,
  ...rest
}: {
  code: string;
  language?: string | null;
  syntaxThemeId?: TRNHighlightedJsonSyntaxThemeId;
  className?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  "data-md-line"?: number;
}) {
  const [copied, setCopied] = useState(false);
  const lang = normalizePrismLanguage(language);
  const prismStyle = TRN_HIGHLIGHTED_JSON_PRISM_STYLES[syntaxThemeId];

  const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void writeClipboardText(code).then((ok) => {
      if (!ok) {
        return;
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div
      {...rest}
      onClick={onClick}
      className={twMerge(
        "presentation-fenced-code group relative overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--course-md-block-code-bg,var(--surface-card))] text-xs leading-relaxed",
        className,
      )}
    >
      <div className="presentation-fenced-code__toolbar flex items-center justify-between gap-2 border-b border-[var(--surface-border)] px-2 py-1">
        <span className="truncate text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          {lang}
        </span>
        <TRNIconButton
          variant="ghost"
          className="h-6 w-6 shrink-0"
          icon={
            copied ? (
              <Check size={12} strokeWidth={2.25} aria-hidden />
            ) : (
              <Copy size={12} strokeWidth={2.25} aria-hidden />
            )
          }
          label={copied ? "Copied code" : "Copy code"}
          nativeTitle={false}
          hint={copied ? "Copied to clipboard" : "Copy code block"}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={handleCopy}
        />
      </div>
      <div className="presentation-fenced-code__body scrollbar-hide overflow-x-auto px-3 py-2">
        <SyntaxHighlighter
          key={syntaxThemeId}
          style={prismStyle}
          language={lang}
          showLineNumbers
          wrapLongLines
          PreTag="div"
          customStyle={{
            margin: 0,
            background: "transparent",
            padding: 0,
          }}
          lineNumberStyle={{
            minWidth: "2.25em",
            paddingRight: "1em",
            userSelect: "none",
            opacity: 0.55,
            color: "var(--text-muted)",
          }}
          codeTagProps={{
            style: {
              fontFamily: CODE_FONT_FAMILY,
              fontSize: "0.75rem",
              lineHeight: "1.625",
              userSelect: "text",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
