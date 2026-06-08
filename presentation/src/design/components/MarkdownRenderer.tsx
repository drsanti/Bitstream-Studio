/**
 * MarkdownRenderer — renders markdown with Shiki syntax highlighting.
 * Used for: speaker notes (notes.md), code slide (08) prose.
 *
 * react-markdown v9 Components API:
 *   - inline code:  `code` without a language class
 *   - fenced block: `pre > code.language-xxx`
 */
import { useState, useEffect, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { codeToHtml } from 'shiki'
import { useThemeStore } from '@/store/useThemeStore'

// ─── Shiki fenced code block ──────────────────────────────────────────────────
function CodeBlock({ className, children }: ComponentPropsWithoutRef<'code'>) {
  const theme   = useThemeStore((s) => s.theme)
  const [html, setHtml] = useState('')
  const lang = /language-(\w+)/.exec(className ?? '')?.[1] ?? 'text'
  const code = String(children).trim()

  useEffect(() => {
    let cancelled = false
    codeToHtml(code, {
      lang,
      theme: theme === 'dark' ? 'github-dark' : 'github-light',
    })
      .then((h) => { if (!cancelled) setHtml(h) })
      .catch(() => { if (!cancelled) setHtml('') })
    return () => { cancelled = true }
  }, [code, lang, theme])

  if (!html) {
    return (
      <pre className="shiki">
        <code>{code}</code>
      </pre>
    )
  }

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// ─── Component map ────────────────────────────────────────────────────────────
const components: Components = {
  // react-markdown v9: inline code has no className, fenced blocks do
  code({ className, children, ...rest }) {
    const isBlock = Boolean(className?.startsWith('language-'))
    if (!isBlock) {
      return (
        <code
          className="font-code text-xs px-1.5 py-0.5 rounded"
          style={{ background: 'var(--surface-hover)', color: 'var(--accent-cyan)' }}
          {...rest}
        >
          {children}
        </code>
      )
    }
    return <CodeBlock className={className}>{children}</CodeBlock>
  },
}

// ─── Public component ─────────────────────────────────────────────────────────
interface Props {
  content:    string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={`prose prose-sm max-w-none prose-notes ${className}`}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}
