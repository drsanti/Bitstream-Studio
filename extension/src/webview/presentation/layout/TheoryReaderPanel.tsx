import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { flatSlides } from "../chapters/registry";
import { useChapterStore } from "../app/useChapterStore";
import { PresentationTheoryMarkdown } from "../components/PresentationTheoryMarkdown";

export function TheoryReaderPanel() {
  const readerOpen = useChapterStore((s) => s.readerOpen);
  const toggleReader = useChapterStore((s) => s.toggleReader);
  const slideIndex = useChapterStore((s) => s.slideIndex);
  const slide = flatSlides[slideIndex];
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slide?.theory) {
      setContent(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    slide
      .theory!()
      .then((mod) => {
        if (!cancelled) {
          setContent(mod.default);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContent(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slide, slideIndex]);

  if (!readerOpen) {
    return null;
  }

  const hasTheory = Boolean(slide?.theory);

  return (
    <aside
      className="presentation-reader-panel flex h-full w-[min(440px,42%)] shrink-0 flex-col border-l"
      aria-label="Theory reader"
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--surface-border)] px-4">
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <BookOpen size={13} strokeWidth={1.75} style={{ color: "var(--accent-purple)" }} />
          <span className="truncate">Theory reader — {slide?.title}</span>
        </div>
        <button
          type="button"
          aria-label="Close theory reader"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
          onClick={toggleReader}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : hasTheory && content ? (
          <PresentationTheoryMarkdown markdown={content} />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            No reader content for this slide yet. Theory articles are added per slide as{" "}
            <code className="text-[var(--accent-cyan)]">theory.md</code> alongside speaker notes.
          </p>
        )}
      </div>
    </aside>
  );
}
