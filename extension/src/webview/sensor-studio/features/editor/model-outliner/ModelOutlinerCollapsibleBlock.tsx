import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

export type ModelOutlinerCollapsibleBlockProps = {
  title: string;
  count?: number;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children: ReactNode;
};

export function ModelOutlinerCollapsibleBlock(props: ModelOutlinerCollapsibleBlockProps) {
  const { title, count, defaultExpanded = true, onExpandedChange, children } = props;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <section className="mb-2 min-w-0">
      <button
        type="button"
        className="mb-1 flex w-full items-center gap-1 rounded px-0.5 py-0.5 text-left text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-900/50 hover:text-zinc-200"
        aria-expanded={expanded}
        onClick={toggle}
      >
        {expanded ? (
          <ChevronDown className="size-3 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="size-3 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {count != null ? <span className="shrink-0 text-zinc-600">{count}</span> : null}
      </button>
      {expanded ? children : null}
    </section>
  );
}
