import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { chapters, flatSlides } from "../chapters/registry";
import { useChapterStore } from "../app/useChapterStore";

const MODE_BADGE: Record<string, string> = {
  theory: "T",
  demo: "D",
  lab: "L",
};

export function ChapterSidebar() {
  const slideIndex = useChapterStore((s) => s.slideIndex);
  const goToSlide = useChapterStore((s) => s.goToSlide);

  return (
    <aside className="presentation-sidebar hidden w-[220px] shrink-0 flex-col border-r md:flex">
      <div className="border-b border-[var(--surface-border)] px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Chapters
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
        {chapters.map((chapter) => {
          const Icon = ((LucideIcons as Record<string, LucideIcon>)[chapter.icon] ??
            LucideIcons.BookOpen) as LucideIcon;
          const chapterSlides = flatSlides.filter((s) => s.chapterId === chapter.id);

          return (
            <div key={chapter.id} className="mb-3">
              <div className="mb-1 flex items-center gap-2 px-2 py-1 text-xs font-bold text-[var(--text-secondary)]">
                <Icon size={13} strokeWidth={1.75} />
                {chapter.title}
              </div>
              <div className="space-y-0.5">
                {chapterSlides.map((slide) => {
                  const active = slide.flatIndex === slideIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => goToSlide(slide.flatIndex)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors ${
                        active
                          ? "border border-[var(--accent-cyan)] bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)]"
                          : "border border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="font-code text-2xs w-4 shrink-0 opacity-70">
                        {MODE_BADGE[slide.mode] ?? "?"}
                      </span>
                      <span className="truncate">{slide.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
