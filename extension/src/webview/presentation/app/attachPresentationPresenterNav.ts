import { useChapterStore } from "./useChapterStore";
import { usePresentationPresenterStore } from "../store/usePresentationPresenterStore";

export function attachPresentationPresenterNav(): () => void {
  const handler = (e: KeyboardEvent) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as Element)?.tagName ?? "")) {
      return;
    }

    const presenter = usePresentationPresenterStore.getState();

    switch (e.key) {
      case "p":
      case "P":
        presenter.togglePresentMode();
        break;
      case "l":
      case "L":
        presenter.toggleLaser();
        break;
      case "+":
      case "=":
        e.preventDefault();
        presenter.zoomIn();
        break;
      case "-":
      case "_":
        e.preventDefault();
        presenter.zoomOut();
        break;
      case "0":
        presenter.resetViewport();
        break;
      case "Escape": {
        const state = usePresentationPresenterStore.getState();
        if (state.laserEnabled) {
          presenter.setLaserEnabled(false);
        } else if (state.zoom !== 1 || state.panX !== 0 || state.panY !== 0) {
          presenter.resetViewport();
        } else if (state.presentMode) {
          presenter.setPresentMode(false);
        } else if (useChapterStore.getState().readerOpen) {
          useChapterStore.getState().toggleReader();
        } else if (useChapterStore.getState().notesOpen) {
          useChapterStore.getState().toggleNotes();
        }
        break;
      }
      default:
        break;
    }

    if (e.shiftKey && presenter.zoom > 1) {
      const step = 24;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          presenter.panBy(step, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          presenter.panBy(-step, 0);
          break;
        case "ArrowUp":
          e.preventDefault();
          presenter.panBy(0, step);
          break;
        case "ArrowDown":
          e.preventDefault();
          presenter.panBy(0, -step);
          break;
        default:
          break;
      }
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}
