import ReactMarkdown from "react-markdown";
import {
  Children,
  isValidElement,
  useMemo,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";
import "katex/dist/katex.min.css";
import { PresentationCallout } from "./PresentationCallout";
import { PresentationFencedCodeBlock } from "./PresentationFencedCodeBlock";
import { PresentationMermaidBlock } from "./PresentationMermaidBlock";
import { parseMarkdownAdmonition } from "../shared/markdownAdmonition";
import { markdownNodeToPlainText } from "../shared/markdownNodeText";
import {
  isPresentationMathCodeClass,
  presentationRehypePlugins,
  presentationRemarkPlugins,
} from "../shared/presentationMarkdownPipeline";
import type { MarkdownBlockColors, MarkdownBlockMermaidTheme } from "../../course-studio/schemas/markdownBlockColors";
import {
  resolveMarkdownBlockCodeSyntaxTheme,
  resolveMarkdownBlockMermaidTheme,
} from "../../course-studio/schemas/markdownBlockColors";
import { resolveCourseMarkdownImageSrc } from "../../course-studio/content/resolveCourseMarkdownImageSrc";
import type { TRNHighlightedJsonSyntaxThemeId } from "../../ui/TRN/trnHighlightedJsonSyntaxThemes";

export type PresentationTheoryMarkdownProps = {
  markdown: string;
  className?: string;
  colors?: MarkdownBlockColors;
  /** When set, preview blocks jump to the matching source line on click. */
  onSourceLineClick?: (line: number) => void;
};

const REMARK_PLUGINS = presentationRemarkPlugins();
const REHYPE_PLUGINS = presentationRehypePlugins();

const PROSE_BODY_CLASS =
  "text-sm leading-relaxed text-[var(--course-md-body,var(--text-prose,var(--text-primary)))]";

const SOURCE_NAV_CLASS =
  "course-md-preview-block cursor-pointer rounded-sm transition-colors hover:bg-amber-500/10";

function headingClass(level: 1 | 2 | 3 | 4): string {
  if (level === 1) {
    return "mb-3 text-lg font-bold text-[var(--course-md-h1,var(--text-primary))] first:mt-0";
  }
  if (level === 2) {
    return "mt-6 mb-3 text-base font-bold text-[var(--course-md-h2,var(--text-primary))] first:mt-0";
  }
  if (level === 3) {
    return "mt-4 mb-2 text-sm font-semibold text-[var(--course-md-h3,var(--text-primary))]";
  }
  return "mt-3 mb-1.5 text-sm font-semibold text-[var(--course-md-h4,var(--text-secondary))]";
}

type MarkdownNode = {
  position?: { start?: { line?: number } };
};

function sourceLineFromNode(node: unknown): number | null {
  const line = (node as MarkdownNode | undefined)?.position?.start?.line;
  return typeof line === "number" ? line : null;
}

function sourceNavProps(
  node: unknown,
  onSourceLineClick: ((line: number) => void) | undefined,
  className?: string,
): { className?: string; onClick?: (event: MouseEvent) => void; "data-md-line"?: number } {
  if (onSourceLineClick == null) {
    return className != null ? { className } : {};
  }
  const line = sourceLineFromNode(node);
  if (line == null) {
    return className != null ? { className } : {};
  }
  return {
    className: twMerge(SOURCE_NAV_CLASS, className),
    "data-md-line": line,
    onClick: (event: MouseEvent) => {
      event.preventDefault();
      onSourceLineClick(line);
    },
  };
}

function codeLanguage(className: string | undefined): string | null {
  const match = className?.match(/language-([\w-]+)/);
  return match?.[1] ?? null;
}

function createMarkdownComponents(
  onSourceLineClick?: (line: number) => void,
  codeSyntaxThemeId?: TRNHighlightedJsonSyntaxThemeId,
  mermaidTheme?: MarkdownBlockMermaidTheme,
): ComponentProps<typeof ReactMarkdown>["components"] {
  return {
    h1: ({ node, children, className, ...props }) => (
      <h1 {...props} {...sourceNavProps(node, onSourceLineClick, twMerge(headingClass(1), className))}>
        {children}
      </h1>
    ),
    h2: ({ node, children, className, ...props }) => (
      <h2 {...props} {...sourceNavProps(node, onSourceLineClick, twMerge(headingClass(2), className))}>
        {children}
      </h2>
    ),
    h3: ({ node, children, className, ...props }) => (
      <h3 {...props} {...sourceNavProps(node, onSourceLineClick, twMerge(headingClass(3), className))}>
        {children}
      </h3>
    ),
    h4: ({ node, children, className, ...props }) => (
      <h4 {...props} {...sourceNavProps(node, onSourceLineClick, twMerge(headingClass(4), className))}>
        {children}
      </h4>
    ),
    p: ({ node, children, className, ...props }) => (
      <p
        {...props}
        {...sourceNavProps(node, onSourceLineClick, twMerge(`my-2 ${PROSE_BODY_CLASS}`, className))}
      >
        {children}
      </p>
    ),
    ul: ({ node, children, className, ...props }) => (
      <ul
        {...props}
        {...sourceNavProps(node, onSourceLineClick, twMerge(`my-2 list-disc space-y-1 pl-5 ${PROSE_BODY_CLASS}`, className))}
      >
        {children}
      </ul>
    ),
    ol: ({ node, children, className, ...props }) => (
      <ol
        {...props}
        {...sourceNavProps(node, onSourceLineClick, twMerge(`my-2 list-decimal space-y-1 pl-5 ${PROSE_BODY_CLASS}`, className))}
      >
        {children}
      </ol>
    ),
    li: ({ node, children, className, ...props }) => (
      <li {...props} {...sourceNavProps(node, onSourceLineClick, twMerge("leading-relaxed", className))}>
        {children}
      </li>
    ),
    strong: ({ children, className, ...props }) => (
      <strong
        {...props}
        className={twMerge(
          "font-semibold text-[var(--course-md-strong,var(--text-primary))]",
          className,
        )}
      >
        {children}
      </strong>
    ),
    a: ({ children, href, className, ...props }) => (
      <a
        {...props}
        href={href}
        className={twMerge(
          "text-[var(--course-md-link,var(--accent-cyan))] underline decoration-[var(--course-md-link,var(--accent-cyan))]/40 underline-offset-2 hover:decoration-[var(--course-md-link,var(--accent-cyan))]",
          className,
        )}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    img: ({ src, alt, className, ...props }) => (
      <img
        {...props}
        src={resolveCourseMarkdownImageSrc(typeof src === "string" ? src : undefined)}
        alt={alt ?? ""}
        className={twMerge(
          "my-3 max-w-full rounded-lg border border-[var(--surface-border)]",
          className,
        )}
      />
    ),
    blockquote: ({ node, children, className, ...props }) => {
      const plain = markdownNodeToPlainText(children).trim();
      const admonition = parseMarkdownAdmonition(plain);
      if (admonition != null) {
        return (
          <div {...sourceNavProps(node, onSourceLineClick)}>
            <PresentationCallout
              variant={admonition.variant}
              title={admonition.title}
              body={admonition.body}
            />
          </div>
        );
      }
      return (
        <blockquote
          {...props}
          {...sourceNavProps(
            node,
            onSourceLineClick,
            twMerge(
              `my-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 ${PROSE_BODY_CLASS}`,
              className,
            ),
          )}
        >
          {children}
        </blockquote>
      );
    },
    code: ({ className, children, ...props }) => {
      if (isPresentationMathCodeClass(className)) {
        return (
          <code {...props} className={className}>
            {children}
          </code>
        );
      }
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <code {...props} className={className}>
            {children}
          </code>
        );
      }
      return (
        <code
          {...props}
          className={twMerge(
            "rounded border border-[var(--surface-border)] px-1 py-0.5 text-xs text-[var(--course-md-inline-code,var(--accent-cyan))] bg-[var(--course-md-inline-code-bg,var(--surface-card))]",
            className,
          )}
        >
          {children}
        </code>
      );
    },
    pre: ({ node, children, className, ...props }) => {
      const child = Children.only(children) as ReactNode;
      if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
        const lang = codeLanguage(child.props.className);
        if (lang === "mermaid") {
          const code = String(child.props.children ?? "").replace(/\n$/, "");
          return (
            <PresentationMermaidBlock
              code={code}
              theme={mermaidTheme}
              className={sourceNavProps(node, onSourceLineClick).className}
            />
          );
        }
        if (!isPresentationMathCodeClass(child.props.className)) {
          const code = String(child.props.children ?? "").replace(/\n$/, "");
          const nav = sourceNavProps(node, onSourceLineClick, "my-3");
          return (
            <PresentationFencedCodeBlock
              code={code}
              language={lang ?? "text"}
              syntaxThemeId={codeSyntaxThemeId}
              className={nav.className}
              onClick={nav.onClick}
              data-md-line={nav["data-md-line"]}
            />
          );
        }
      }
      return (
        <pre
          {...props}
          {...sourceNavProps(
            node,
            onSourceLineClick,
            twMerge(
              "my-3 overflow-x-auto rounded-lg border border-[var(--surface-border)] bg-[var(--course-md-block-code-bg,var(--surface-card))] p-3 text-xs leading-relaxed text-[var(--course-md-block-code,var(--text-primary))]",
              className,
            ),
          )}
        >
          {children}
        </pre>
      );
    },
    table: ({ node, children, className, ...props }) => (
      <div {...sourceNavProps(node, onSourceLineClick, "my-3 overflow-x-auto")}>
        <table
          {...props}
          className={twMerge(
            "w-full border-collapse text-left text-sm text-[var(--course-md-body,var(--text-prose,var(--text-primary)))]",
            className,
          )}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children, className, ...props }) => (
      <th
        {...props}
        className={twMerge(
          "border border-[var(--surface-border)] bg-[var(--course-md-block-code-bg,var(--surface-card))] px-3 py-2 font-semibold text-[var(--course-md-h3,var(--text-primary))]",
          className,
        )}
      >
        {children}
      </th>
    ),
    td: ({ children, className, ...props }) => (
      <td
        {...props}
        className={twMerge("border border-[var(--surface-border)] px-3 py-2", className)}
      >
        {children}
      </td>
    ),
    hr: ({ node, className, ...props }) => (
      <hr
        {...props}
        {...sourceNavProps(node, onSourceLineClick, twMerge("my-5 border-[var(--surface-border)]", className))}
      />
    ),
  };
}

export function PresentationTheoryMarkdown({
  markdown,
  className,
  colors,
  onSourceLineClick,
}: PresentationTheoryMarkdownProps) {
  const codeSyntaxThemeId = resolveMarkdownBlockCodeSyntaxTheme(colors);
  const mermaidTheme = resolveMarkdownBlockMermaidTheme(colors);
  const components = useMemo(
    () => createMarkdownComponents(onSourceLineClick, codeSyntaxThemeId, mermaidTheme),
    [onSourceLineClick, codeSyntaxThemeId, mermaidTheme],
  );

  return (
    <div className={twMerge("presentation-theory-markdown max-w-none", className)}>
      {onSourceLineClick != null ? (
        <p className="mb-2 text-[10px] text-[var(--text-muted)]">
          Click a preview block to jump to its source line.
        </p>
      ) : null}
      <ReactMarkdown
        key={codeSyntaxThemeId}
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
