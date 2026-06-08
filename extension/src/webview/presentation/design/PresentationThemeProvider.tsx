import { useEffect, type ReactNode } from "react";
import { presentationThemeVars } from "./theme";
import { usePresentationThemeStore } from "../store/usePresentationThemeStore";
import { usePresentationPresenterStore } from "../store/usePresentationPresenterStore";

export function PresentationThemeProvider({
  children,
  rootClassName = "presentation-root",
}: {
  children: ReactNode;
  rootClassName?: string;
}) {
  const theme = usePresentationThemeStore((s) => s.theme);
  const presentMode = usePresentationPresenterStore((s) => s.presentMode);

  useEffect(() => {
    const el = document.querySelector(`.${rootClassName}`);
    if (!(el instanceof HTMLElement)) {
      return;
    }
    el.setAttribute("data-presentation-theme", theme);
    const vars = presentationThemeVars(theme);
    for (const [key, value] of Object.entries(vars)) {
      el.style.setProperty(key, value);
    }
  }, [theme, rootClassName]);

  return (
    <div
      className={`${rootClassName}${presentMode ? " presentation-root--present" : ""} flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--surface-bg)] text-[var(--text-primary)]`}
      data-presentation-theme={theme}
    >
      {children}
    </div>
  );
}
