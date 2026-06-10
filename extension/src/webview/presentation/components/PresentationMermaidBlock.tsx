import { useEffect, useId, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import type { MarkdownBlockMermaidTheme } from "../../course-studio/schemas/markdownBlockColors";

async function loadMermaid(theme: MarkdownBlockMermaidTheme) {
  const mod = await import("mermaid");
  mod.default.initialize({
    startOnLoad: false,
    theme,
    securityLevel: "strict",
  });
  return mod;
}

export function PresentationMermaidBlock({
  code,
  className,
  theme = "dark",
}: {
  code: string;
  className?: string;
  theme?: MarkdownBlockMermaidTheme;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (container == null) {
      return;
    }

    void (async () => {
      try {
        const mermaid = await loadMermaid(theme);
        if (cancelled) {
          return;
        }
        const { svg } = await mermaid.default.render(`course-md-mermaid-${renderId}`, code.trim());
        if (cancelled || containerRef.current == null) {
          return;
        }
        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mermaid render failed.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, renderId, theme]);

  if (error != null) {
    return (
      <pre
        className={twMerge(
          "my-3 overflow-x-auto rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] p-3 text-xs text-[var(--text-muted)]",
          className,
        )}
      >
        {code}
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className={twMerge(
        "course-md-mermaid my-3 overflow-x-auto rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] p-3",
        className,
      )}
    />
  );
}
