import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { twMerge } from "tailwind-merge";
import { ExternalLink } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { writeClipboardText } from "../utils/clipboard";
import { openAssistantHtmlInBrowser, useHtmlPreviewDeliveryStore } from "./htmlPreviewDelivery.store";
import { useTrnMarkdownZoomStore } from "./markdownZoom.store";

export type TrnMarkdownTone = "neutral" | "info" | "warn" | "danger";
export type TrnMarkdownScrollbars =
  | "none"
  | "dark-small"
  | "dark-micro"
  | "edge-reveal";

export type TrnMarkdownRendererProps = {
  markdown: string;
  className?: string;
  tone?: TrnMarkdownTone;
  scrollbars?: TrnMarkdownScrollbars;
  enableCodeCopy?: boolean;
  enableSyntaxHighlight?: boolean;
  /**
   * If true, enables Ctrl+wheel + keyboard shortcuts on this renderer when it is focused.
   * This uses the global markdown zoom store.
   */
  enableZoom?: boolean;
  onCopyCodeBlock?: (text: string, ok: boolean) => void;
  /**
   * When true, fenced ```html``` blocks show a sandboxed live preview tab (scripts off by default; Advanced can allow JS + popups).
   * Inline HTML in markdown is still not rendered as DOM by this component.
   */
  enableHtmlPreview?: boolean;
  /**
   * When true, full-page HTML fences without `</html>` are treated as **still streaming** (hide iframe until complete).
   * When false, missing `</html>` means **generation finished but truncated** — show recovery UI + optional partial preview.
   * Bitstream Assistant passes `true` only for the **last** assistant bubble while `awaitingCompletion`.
   */
  htmlFenceGenerationMayStillStream?: boolean;
};

function extractText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((n) => extractText(n)).join("");
  if (typeof node === "object") {
    const maybeChildren = (node as { props?: { children?: unknown } }).props?.children;
    if (maybeChildren !== undefined) return extractText(maybeChildren);
  }
  return "";
}

function headingColor(tone: TrnMarkdownTone | undefined, level: 2 | 3): string {
  const t = tone ?? "neutral";
  if (t === "info") return level === 2 ? "text-cyan-100" : "text-violet-100";
  if (t === "warn") return level === 2 ? "text-amber-100" : "text-orange-100";
  if (t === "danger") return level === 2 ? "text-rose-100" : "text-amber-100";
  return level === 2 ? "text-zinc-100" : "text-zinc-200";
}

function blockquoteToneClass(tone: TrnMarkdownTone | undefined): string {
  const t = tone ?? "neutral";
  if (t === "info") {
    return "border-sky-500/35 bg-sky-950/15 text-sky-100/95";
  }
  if (t === "warn") {
    return "border-amber-500/35 bg-amber-950/15 text-amber-100/95";
  }
  if (t === "danger") {
    return "border-rose-500/35 bg-rose-950/15 text-rose-100/95";
  }
  return "border-zinc-500/35 bg-zinc-950/20 text-zinc-100/90";
}

function scrollbarClass(scrollbars: TrnMarkdownScrollbars | undefined): string {
  if (scrollbars === "dark-small") return "scrollbar-dark-small";
  if (scrollbars === "dark-micro") return "scrollbar-dark-micro";
  if (scrollbars === "edge-reveal") return "scrollbar-edge-reveal";
  return "";
}

function looksLikeHtmlDocument(source: string): boolean {
  const s = source.trimStart();
  return /^<!DOCTYPE\b/i.test(s) || /^<html\b/i.test(s);
}

/**
 * Streamed LLM output often fills ```html``` before `</html>` exists — feeding that into `iframe srcDoc`
 * shows a broken partial page. Full documents: wait for `</html>`. Snippets (no doctype/html opener): preview anytime.
 */
function isLikelyCompleteHtmlDocumentForPreview(source: string): boolean {
  if (!looksLikeHtmlDocument(source)) {
    return true;
  }
  return /<\/html\b[^>]*>/i.test(source);
}

type HtmlFenceTab = "preview" | "source";

/** Relaxed sandbox when Advanced enables JS — popups stay sandboxed (no allow-popups-to-escape-sandbox). */
const HTML_PREVIEW_SANDBOX_RELAXED = "allow-scripts allow-popups";

/**
 * `pre` often wraps the output of our custom `code` in extra nodes (whitespace, Fragment). A strict
 * `child.type === HtmlFencedBlock` check then misses, and we wrap again in `CopyableCodeBlock` → duplicate Copy UI.
 */
/** Survives duplicate `type` identity (e.g. HMR) when `n.type === HtmlFencedBlock` fails. */
function isTrnHtmlFencedBlockType(t: unknown): boolean {
  return typeof t === "function" && (t as { trnHtmlFence?: true }).trnHtmlFence === true;
}

function isHtmlFencedBlockElement(n: unknown): n is ReactElement {
  if (!isValidElement(n)) {
    return false;
  }
  if (n.type === HtmlFencedBlock || isTrnHtmlFencedBlockType(n.type)) {
    return true;
  }
  const p = n.props as Record<string, unknown> | undefined;
  if (p == null || typeof p.source !== "string") {
    return false;
  }
  return (
    typeof p.generationMayStillStream === "boolean" &&
    typeof p.enableCopy === "boolean" &&
    typeof p.enableSyntaxHighlight === "boolean"
  );
}

function findHtmlFenceInPreChildren(children: React.ReactNode, depth = 0): ReactElement | null {
  if (depth > 10) {
    return null;
  }
  for (const n of Children.toArray(children)) {
    if (isHtmlFencedBlockElement(n)) {
      return n;
    }
    if (isValidElement(n) && n.props != null && "children" in n.props && n.props.children != null) {
      const found = findHtmlFenceInPreChildren(n.props.children as React.ReactNode, depth + 1);
      if (found != null) {
        return found;
      }
    }
  }
  return null;
}

/** Marker component: ```html``` fences use this so `pre` can skip the generic code chrome wrapper. */
function HtmlFencedBlock(props: {
  source: string;
  enableCopy: boolean;
  enableSyntaxHighlight: boolean;
  onCopied?: (text: string, ok: boolean) => void;
  generationMayStillStream: boolean;
}) {
  const { source, enableCopy, enableSyntaxHighlight, onCopied, generationMayStillStream } = props;
  const deliveryMode = useHtmlPreviewDeliveryStore((s) => s.deliveryMode);
  const htmlPreviewSandboxAllowScripts = useHtmlPreviewDeliveryStore((s) => s.htmlPreviewSandboxAllowScripts);
  const showSandboxPreview = deliveryMode === "sandbox" || deliveryMode === "both";
  const [tab, setTab] = useState<HtmlFenceTab>(() =>
    looksLikeHtmlDocument(source) ? "preview" : "source",
  );
  const sawDocLikeRef = useRef(looksLikeHtmlDocument(source));
  useEffect(() => {
    const now = looksLikeHtmlDocument(source);
    if (now && !sawDocLikeRef.current) {
      sawDocLikeRef.current = true;
      setTab("preview");
    }
  }, [source]);

  const tabBtn = (id: HtmlFenceTab, label: string) => (
    <button
      key={id}
      type="button"
      className={
        tab === id
          ? "rounded border border-cyan-500/40 bg-cyan-950/35 px-2 py-0.5 text-[10px] font-medium text-cyan-100/95"
          : "rounded border border-transparent px-2 py-0.5 text-[10px] text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      }
      aria-pressed={tab === id}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );

  const [copied, setCopied] = useState(false);
  const [previewPartialAnyway, setPreviewPartialAnyway] = useState(false);

  useEffect(() => {
    setPreviewPartialAnyway(false);
  }, [source]);

  const docLikeIncomplete =
    looksLikeHtmlDocument(source) && !isLikelyCompleteHtmlDocumentForPreview(source);
  const streamingGate =
    docLikeIncomplete && generationMayStillStream && !previewPartialAnyway;
  const truncatedGate =
    docLikeIncomplete && !generationMayStillStream && !previewPartialAnyway;
  const blockBrowserWhileIncompleteStream =
    docLikeIncomplete && generationMayStillStream && !previewPartialAnyway;

  return (
    <div className="group relative my-2 rounded border border-zinc-700/80 bg-black/30">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-700/60 px-2 py-1.5">
        <div className="flex items-center gap-1">
          {tabBtn("preview", "Preview")}
          {tabBtn("source", "Source")}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            disabled={blockBrowserWhileIncompleteStream}
            aria-label="Open HTML in system browser"
            title={
              blockBrowserWhileIncompleteStream
                ? "Wait until streaming finishes or </html> arrives before opening in the browser"
                : "Open this HTML in your default system browser (full scripts and assets)"
            }
            className="inline-flex h-6 shrink-0 items-center gap-1 rounded border border-cyan-600/45 bg-cyan-950/40 px-2 text-[10px] font-medium text-cyan-50 hover:bg-cyan-900/40 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-900/60 disabled:text-zinc-600"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => void openAssistantHtmlInBrowser(source)}
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
            Open in browser
          </button>
          {enableCopy ? (
            <button
              type="button"
              className="inline-flex h-6 items-center rounded border border-white/10 bg-white/5 px-2 text-[10px] text-zinc-200/90 hover:bg-white/10"
              aria-label="Copy HTML"
              title="Copy HTML"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                void writeClipboardText(source).then((ok) => {
                  onCopied?.(source, ok);
                  if (!ok) return;
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 900);
                });
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
        </div>
      </div>
      {tab === "preview" ? (
        <div className="flex flex-col gap-2 p-2 pt-1">
          {showSandboxPreview ? (
            <>
              <p className="m-0 text-[10px] leading-snug text-zinc-500">
                {htmlPreviewSandboxAllowScripts ? (
                  <>
                    Sandboxed preview — <span className="font-medium text-amber-200/90">JavaScript + popups</span>{" "}
                    (Advanced). Scripts and <code className="font-mono text-[9px]">window.open</code> run in an
                    isolated iframe, not in the assistant UI. Some CDN or file URLs may still fail due to webview or
                    network policy.
                  </>
                ) : (
                  <>
                    Sandboxed preview — <span className="font-medium text-zinc-400">scripts are off</span> (default),
                    so pages that rely on Chart.js / inline JS look blank or broken here. Turn on{" "}
                    <span className="font-medium text-zinc-400">Allow JavaScript and popups in HTML preview</span> in
                    Advanced, or use <span className="font-medium text-zinc-400">Open in browser</span>.
                  </>
                )}
              </p>
              {streamingGate ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-2 rounded border border-amber-500/35 bg-amber-950/25 px-4 py-8 text-center"
                >
                  <p className="m-0 max-w-md text-[11px] font-medium leading-snug text-amber-50/95">
                    The assistant is still writing this HTML. The sandbox iframe waits until the stream contains a{" "}
                    <span className="whitespace-nowrap">
                      closing{" "}
                      <code className="rounded bg-black/35 px-1 py-0.5 font-mono text-[10px]">&lt;/html&gt;</code>
                    </span>{" "}
                    tag so you don&apos;t see a broken half-page (truncated CSS, missing SVG, etc.).
                  </p>
                  <p className="m-0 max-w-md text-[10px] leading-snug text-zinc-500">
                    Switch to <span className="font-medium text-zinc-400">Source</span> to watch bytes arrive in real
                    time. When <code className="rounded bg-black/35 px-0.5 font-mono text-[10px]">&lt;/html&gt;</code>{" "}
                    appears, <span className="font-medium text-zinc-400">Preview</span> fills in automatically.
                  </p>
                </div>
              ) : truncatedGate ? (
                <div
                  role="status"
                  className="flex min-h-[min(36vh,280px)] flex-col items-center justify-center gap-3 rounded border border-rose-500/35 bg-rose-950/20 px-4 py-8 text-center"
                >
                  <p className="m-0 max-w-md text-[11px] font-medium leading-snug text-rose-50/95">
                    This reply has no closing{" "}
                    <code className="rounded bg-black/35 px-1 py-0.5 font-mono text-[10px]">&lt;/html&gt;</code> — the
                    model output looks <span className="text-rose-100/95">truncated</span> (for example cut mid-line) or
                    the markdown fence closed before the document finished.
                  </p>
                  <p className="m-0 max-w-md text-[10px] leading-snug text-zinc-500">
                    Ask for a <span className="font-medium text-zinc-400">shorter</span> page, or split chart + table,
                    or regenerate. You can still preview what arrived (layout may be broken).
                  </p>
                  <button
                    type="button"
                    className="inline-flex h-7 shrink-0 items-center rounded border border-rose-500/45 bg-rose-950/45 px-3 text-[10px] font-medium text-rose-50 hover:bg-rose-900/35"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setPreviewPartialAnyway(true)}
                  >
                    Preview partial page
                  </button>
                </div>
              ) : (
                <iframe
                  title="HTML preview"
                  className="scrollbar-dark-micro h-[calc(100vh-320px)] min-h-[360px] w-full rounded border border-zinc-700/70 bg-white"
                  sandbox={htmlPreviewSandboxAllowScripts ? HTML_PREVIEW_SANDBOX_RELAXED : ""}
                  srcDoc={source}
                />
              )}
            </>
          ) : null}
          {deliveryMode === "browser" && tab === "preview" ? (
            <div className="rounded border border-zinc-700/50 bg-black/20 px-2 py-2">
              <p className="m-0 text-[10px] leading-snug text-zinc-500">
                This profile hides the inline sandbox. Use <span className="font-medium text-zinc-400">Open in browser</span>{" "}
                in the bar above — scripts and CDN assets typically work there.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="scrollbar-dark-micro select-text overflow-x-auto p-2 font-mono text-[11px] leading-snug text-zinc-100">
          {enableSyntaxHighlight ? (
            <SyntaxHighlighter
              style={oneDark}
              language="html"
              PreTag="div"
              customStyle={{
                margin: 0,
                background: "transparent",
                padding: 0,
              }}
              codeTagProps={{
                style: {
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  fontSize: "11px",
                  lineHeight: "1.35",
                  userSelect: "text",
                },
              }}
            >
              {source}
            </SyntaxHighlighter>
          ) : (
            <pre className="m-0 whitespace-pre-wrap wrap-break-word">
              <code>{source}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

type HtmlFencedBlockComponent = typeof HtmlFencedBlock & { trnHtmlFence?: true };
(HtmlFencedBlock as HtmlFencedBlockComponent).trnHtmlFence = true;

function CopyableCodeBlock(props: {
  children: React.ReactNode;
}) {
  const htmlFence = useMemo(() => findHtmlFenceInPreChildren(props.children), [props.children]);

  if (htmlFence != null) {
    return htmlFence;
  }

  return (
    <div className="group relative my-2">
      <div className="scrollbar-dark-micro select-text overflow-x-auto rounded border border-zinc-700/80 bg-black/30 p-2 font-mono text-[11px] leading-snug text-zinc-100">
        {props.children}
      </div>
    </div>
  );
}

export function TRNMarkdownZoomControls(props: {
  className?: string;
  compact?: boolean;
}) {
  const zoomPct = useTrnMarkdownZoomStore((s) => s.zoomPct);
  const zoomIn = useTrnMarkdownZoomStore((s) => s.zoomIn);
  const zoomOut = useTrnMarkdownZoomStore((s) => s.zoomOut);
  const reset = useTrnMarkdownZoomStore((s) => s.reset);
  const compact = props.compact !== false;

  const btnClass = compact
    ? "h-6 rounded border border-white/10 bg-white/5 px-2 text-[10px] text-zinc-200/90 hover:bg-white/10"
    : "h-7 rounded border border-white/10 bg-white/5 px-2.5 text-[11px] text-zinc-200/90 hover:bg-white/10";

  return (
    <div className={twMerge("flex items-center gap-1.5", props.className)}>
      <button
        type="button"
        className={btnClass}
        aria-label="Zoom out"
        title="Zoom out (Ctrl+- or ⌘+-)"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => zoomOut()}
      >
        A-
      </button>
      <button
        type="button"
        className={btnClass}
        aria-label="Reset zoom"
        title="Reset zoom (Ctrl+0 or ⌘+0)"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => reset()}
      >
        {zoomPct}%
      </button>
      <button
        type="button"
        className={btnClass}
        aria-label="Zoom in"
        title="Zoom in (Ctrl++ or ⌘++)"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => zoomIn()}
      >
        A+
      </button>
    </div>
  );
}

export function TRNMarkdownRenderer({
  markdown,
  className,
  tone = "info",
  scrollbars = "none",
  enableCodeCopy = true,
  enableSyntaxHighlight = true,
  enableZoom = true,
  onCopyCodeBlock,
  enableHtmlPreview = true,
  htmlFenceGenerationMayStillStream = false,
}: TrnMarkdownRendererProps) {
  const zoomPct = useTrnMarkdownZoomStore((s) => s.zoomPct);
  const zoomIn = useTrnMarkdownZoomStore((s) => s.zoomIn);
  const zoomOut = useTrnMarkdownZoomStore((s) => s.zoomOut);
  const reset = useTrnMarkdownZoomStore((s) => s.reset);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const scale = Math.max(0.6, Math.min(2.2, zoomPct / 100));

  return (
    <div
      ref={rootRef}
      data-trn-markdown-zoom-root={enableZoom ? "" : undefined}
      className={twMerge(
        "max-w-none text-sm text-zinc-200 outline-none",
        scrollbarClass(scrollbars),
        className,
      )}
      style={enableZoom ? { fontSize: `calc(1rem * ${scale})` } : undefined}
      tabIndex={0}
      onPointerDown={() => {
        rootRef.current?.focus();
      }}
      onKeyDown={(ev) => {
        if (!enableZoom || !(ev.ctrlKey || ev.metaKey)) {
          return;
        }
        // Ctrl/Cmd + / − / 0
        if (ev.key === "+" || ev.key === "=") {
          ev.preventDefault();
          zoomIn();
          return;
        }
        if (ev.key === "-" || ev.key === "_") {
          ev.preventDefault();
          zoomOut();
          return;
        }
        if (ev.key === "0") {
          ev.preventDefault();
          reset();
          return;
        }
      }}
      onWheel={(ev) => {
        if (!enableZoom || !(ev.ctrlKey || ev.metaKey)) {
          return;
        }
        ev.preventDefault();
        const d = ev.deltaY;
        if (d > 0) {
          zoomOut();
        } else if (d < 0) {
          zoomIn();
        }
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children, ...props }) => (
            <h2
              {...props}
              className={twMerge(
                "mt-0 text-lg font-semibold tracking-tight",
                headingColor(tone, 2),
              )}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              {...props}
              className={twMerge(
                "mt-4 text-sm font-semibold tracking-tight",
                headingColor(tone, 3),
              )}
            >
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p {...props} className="my-2 leading-relaxed text-zinc-200">
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul {...props} className="my-2 list-disc space-y-1 pl-5 text-zinc-200">
              {children}
            </ul>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="leading-relaxed">
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong {...props} className="font-semibold text-zinc-100">
              {children}
            </strong>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const classStr = typeof codeClassName === "string" ? codeClassName : "";
            const langMatch = classStr.match(/language-([a-z0-9_-]+)/i);
            const language = langMatch?.[1];
            const isFenced = classStr.includes("language-");
            const raw = String(children ?? "");
            const normalized = raw.replace(/\n$/, "");

            if (isFenced && enableHtmlPreview && language?.toLowerCase() === "html") {
              return (
                <HtmlFencedBlock
                  source={normalized}
                  enableCopy={enableCodeCopy}
                  enableSyntaxHighlight={enableSyntaxHighlight}
                  onCopied={onCopyCodeBlock}
                  generationMayStillStream={htmlFenceGenerationMayStillStream}
                />
              );
            }

            if (isFenced) {
              if (!enableSyntaxHighlight) {
                return (
                  <code {...props} className={codeClassName}>
                    {children}
                  </code>
                );
              }
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    background: "transparent",
                    padding: 0,
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      fontSize: "11px",
                      lineHeight: "1.35",
                      userSelect: "text",
                    },
                  }}
                >
                  {normalized}
                </SyntaxHighlighter>
              );
            }

            return (
              <code
                {...props}
                className="select-text rounded border border-zinc-700/80 bg-black/30 px-1 py-0.5 font-mono text-[11px] text-zinc-100"
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            const htmlFence = findHtmlFenceInPreChildren(children);
            if (htmlFence != null) {
              return htmlFence;
            }
            return (
              <CopyableCodeBlock>
                {children}
              </CopyableCodeBlock>
            );
          },
          blockquote: ({ children, ...props }) => (
            <blockquote
              {...props}
              className={twMerge(
                "my-2 rounded border px-3 py-2 text-[12px]",
                blockquoteToneClass(tone),
              )}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

