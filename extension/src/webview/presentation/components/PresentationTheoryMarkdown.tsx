import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import "katex/dist/katex.min.css";
import { PresentationCallout } from "./PresentationCallout";
import { parseMarkdownAdmonition } from "../shared/markdownAdmonition";
import { markdownNodeToPlainText } from "../shared/markdownNodeText";

export type PresentationTheoryMarkdownProps = {
  markdown: string;
  className?: string;
};

const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

function headingClass(level: 2 | 3 | 4): string {
  if (level === 2) {
    return "mt-6 mb-3 text-base font-bold text-[var(--text-primary)] first:mt-0";
  }
  if (level === 3) {
    return "mt-4 mb-2 text-sm font-semibold text-[var(--text-primary)]";
  }
  return "mt-3 mb-1.5 text-sm font-semibold text-[var(--text-secondary)]";
}

const MARKDOWN_COMPONENTS: ComponentProps<typeof ReactMarkdown>["components"] = {
  h2: ({ children, ...props }) => (
    <h2 {...props} className={headingClass(2)}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 {...props} className={headingClass(3)}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 {...props} className={headingClass(4)}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p {...props} className="my-2 text-sm leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul {...props} className="my-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} className="my-2 list-decimal space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li {...props} className="leading-relaxed">
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong {...props} className="font-semibold text-[var(--text-primary)]">
      {children}
    </strong>
  ),
  a: ({ children, href, ...props }) => (
    <a
      {...props}
      href={href}
      className="text-[var(--accent-cyan)] underline decoration-[var(--accent-cyan)]/40 underline-offset-2 hover:decoration-[var(--accent-cyan)]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => {
    const plain = markdownNodeToPlainText(children).trim();
    const admonition = parseMarkdownAdmonition(plain);
    if (admonition != null) {
      return (
        <PresentationCallout
          variant={admonition.variant}
          title={admonition.title}
          body={admonition.body}
        />
      );
    }
    return (
      <blockquote
        {...props}
        className="my-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-secondary)]"
      >
        {children}
      </blockquote>
    );
  },
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          {...props}
          className={twMerge(
            "block overflow-x-auto rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] p-3 text-xs leading-relaxed text-[var(--text-primary)]",
            className,
          )}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        {...props}
        className="rounded border border-[var(--surface-border)] bg-[var(--surface-card)] px-1 py-0.5 text-xs text-[var(--accent-cyan)]"
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre {...props} className="my-3">
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table
        {...props}
        className="w-full border-collapse text-left text-sm text-[var(--text-secondary)]"
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      {...props}
      className="border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 font-semibold text-[var(--text-primary)]"
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td {...props} className="border border-[var(--surface-border)] px-3 py-2">
      {children}
    </td>
  ),
  hr: (props) => <hr {...props} className="my-5 border-[var(--surface-border)]" />,
};

export function PresentationTheoryMarkdown({ markdown, className }: PresentationTheoryMarkdownProps) {
  return (
    <div className={twMerge("presentation-theory-markdown max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
