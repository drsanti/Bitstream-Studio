import { useEffect, useState } from "react";
import { X, MessageSquare } from "lucide-react";
import { flatSlides } from "../chapters/registry";
import { useChapterStore } from "../app/useChapterStore";

export function SpeakerNotesPanel() {
  const notesOpen = useChapterStore((s) => s.notesOpen);
  const toggleNotes = useChapterStore((s) => s.toggleNotes);
  const slideIndex = useChapterStore((s) => s.slideIndex);
  const slide = flatSlides[slideIndex];
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!slide) {
      return;
    }
    slide
      .notes()
      .then((mod) => setContent(mod.default))
      .catch(() => setContent("_No speaker notes for this slide._"));
  }, [slide, slideIndex]);

  if (!notesOpen) {
    return null;
  }

  return (
    <div className="presentation-notes-panel absolute bottom-0 left-0 right-0 z-30 flex h-56 flex-col border-t shadow-lg">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--surface-border)] px-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <MessageSquare size={13} strokeWidth={1.75} style={{ color: "var(--accent-cyan)" }} />
          Speaker notes — {slide?.title}
        </div>
        <button
          type="button"
          aria-label="Close speaker notes"
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
          onClick={toggleNotes}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
