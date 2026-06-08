import { create } from "zustand";
import { chapters, flatSlides } from "../chapters/registry";
import { usePresentationPresenterStore } from "../store/usePresentationPresenterStore";

type ChapterStore = {
  chapterIndex: number;
  slideIndex: number;
  notesOpen: boolean;
  fullscreen: boolean;
  goToChapter: (index: number) => void;
  goToSlide: (index: number) => void;
  next: () => void;
  prev: () => void;
  toggleNotes: () => void;
  toggleFullscreen: () => void;
};

function totalSlides(): number {
  return flatSlides.length;
}

export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapterIndex: 0,
  slideIndex: 0,
  notesOpen: false,
  fullscreen: false,

  goToChapter: (index) => {
    const chapter = chapters[Math.max(0, Math.min(chapters.length - 1, index))];
    const firstSlide = flatSlides.findIndex((s) => s.chapterId === chapter.id);
    set({
      chapterIndex: index,
      slideIndex: firstSlide >= 0 ? firstSlide : 0,
    });
  },

  goToSlide: (index) => set({ slideIndex: Math.max(0, Math.min(totalSlides() - 1, index)) }),

  next: () => {
    const nextIndex = Math.min(get().slideIndex + 1, totalSlides() - 1);
    const slide = flatSlides[nextIndex];
    const chapterIndex = chapters.findIndex((c) => c.id === slide?.chapterId);
    set({
      slideIndex: nextIndex,
      chapterIndex: chapterIndex >= 0 ? chapterIndex : get().chapterIndex,
    });
  },

  prev: () => {
    const prevIndex = Math.max(get().slideIndex - 1, 0);
    const slide = flatSlides[prevIndex];
    const chapterIndex = chapters.findIndex((c) => c.id === slide?.chapterId);
    set({
      slideIndex: prevIndex,
      chapterIndex: chapterIndex >= 0 ? chapterIndex : get().chapterIndex,
    });
  },

  toggleNotes: () => set((s) => ({ notesOpen: !s.notesOpen })),

  toggleFullscreen: () => {
    const entering = !get().fullscreen;
    if (entering) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    set({ fullscreen: entering });
  },
}));

export function attachPresentationKeyboardNav(): () => void {
  const handler = (e: KeyboardEvent) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as Element)?.tagName ?? "")) {
      return;
    }
    const store = useChapterStore.getState();
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
        if (e.shiftKey && usePresentationPresenterStore.getState().zoom > 1) {
          break;
        }
        e.preventDefault();
        store.next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        if (e.shiftKey && usePresentationPresenterStore.getState().zoom > 1) {
          break;
        }
        e.preventDefault();
        store.prev();
        break;
      case "s":
      case "S":
        store.toggleNotes();
        break;
      case "f":
      case "F":
        store.toggleFullscreen();
        break;
      case "Home":
        store.goToSlide(0);
        break;
      case "End":
        store.goToSlide(totalSlides() - 1);
        break;
      default:
        break;
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}
