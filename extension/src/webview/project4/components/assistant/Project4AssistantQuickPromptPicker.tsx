import { ChevronDown, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNMenuItemButton, TRNMenuPanel } from "../../../ui/TRN/TRNMenu";
import {
  PROJECT4_ASSISTANT_QUICK_PROMPTS,
  PROJECT4_ASSISTANT_QUICK_PROMPT_CATEGORY_ORDER,
  persistProject4QuickPromptLocale,
  project4AssistantQuickPromptCategoryLabel,
  project4AssistantQuickPromptCopy,
  readProject4QuickPromptLocale,
  type Project4AssistantQuickPromptCategory,
  type Project4AssistantQuickPromptItem,
  type Project4AssistantQuickPromptLocale,
} from "../../lib/project4-assistant-quick-prompts";
import { twMerge } from "tailwind-merge";

export type Project4AssistantQuickPromptPickerProps = {
  /** Called when the user picks a preset; parent usually focuses the composer */
  onPick: (prompt: string) => void;
  className?: string;
};

export function Project4AssistantQuickPromptPicker(props: Project4AssistantQuickPromptPickerProps) {
  const { onPick, className } = props;
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Project4AssistantQuickPromptLocale>(() => readProject4QuickPromptLocale());
  const rootRef = useRef<HTMLDivElement>(null);

  const setLocaleAndPersist = useCallback((next: Project4AssistantQuickPromptLocale) => {
    setLocale(next);
    persistProject4QuickPromptLocale(next);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<Project4AssistantQuickPromptCategory, Project4AssistantQuickPromptItem[]>();
    for (const cat of PROJECT4_ASSISTANT_QUICK_PROMPT_CATEGORY_ORDER) {
      map.set(cat, []);
    }
    for (const row of PROJECT4_ASSISTANT_QUICK_PROMPTS) {
      map.get(row.category)?.push(row);
    }
    return map;
  }, []);

  const pick = useCallback(
    (text: string) => {
      onPick(text);
      setOpen(false);
    },
    [onPick],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el != null && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={twMerge("relative inline-flex", className)} ref={rootRef}>
      <TRNButton
        type="button"
        className="gap-1.5 border-zinc-600/80 bg-zinc-900/70 px-2.5 hover:bg-zinc-800/75"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Insert a preset (EN/TH) — telemetry, motion, speed, workflows"
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-300/90" strokeWidth={2.25} aria-hidden />
        <span className="text-[11px] font-semibold text-zinc-100">Quick prompts</span>
        <ChevronDown
          className={twMerge("h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform", open ? "rotate-180" : "")}
          aria-hidden
        />
      </TRNButton>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-1 w-[min(380px,calc(100vw-40px))]"
        >
          <TRNMenuPanel tone="subtle" className="max-h-[min(300px,50vh)] overflow-y-auto p-1 scrollbar-dark-micro">
            <div className="sticky top-0 z-10 mb-1 rounded-md border border-zinc-700/70 bg-zinc-950/95 px-2 py-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] leading-snug text-zinc-500">
                  Language · <span className="text-zinc-400">ภาษา</span>
                </span>
                <div className="flex shrink-0 gap-1" role="group" aria-label="Quick prompt language">
                  <TRNButton
                    type="button"
                    className={twMerge(
                      "min-w-9 px-2 text-[10px] font-semibold",
                      locale === "en"
                        ? "border-cyan-600/70 bg-cyan-950/50 text-cyan-50 hover:bg-cyan-900/40"
                        : "border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/75",
                    )}
                    onClick={() => setLocaleAndPersist("en")}
                  >
                    EN
                  </TRNButton>
                  <TRNButton
                    type="button"
                    className={twMerge(
                      "min-w-9 px-2 text-[10px] font-semibold",
                      locale === "th"
                        ? "border-cyan-600/70 bg-cyan-950/50 text-cyan-50 hover:bg-cyan-900/40"
                        : "border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/75",
                    )}
                    onClick={() => setLocaleAndPersist("th")}
                  >
                    TH
                  </TRNButton>
                </div>
              </div>
            </div>

            {PROJECT4_ASSISTANT_QUICK_PROMPT_CATEGORY_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) {
                return null;
              }
              return (
                <div key={cat} className="mb-1 last:mb-0">
                  <div
                    className={twMerge(
                      "px-3 pb-1 pt-2 text-[10px] font-semibold tracking-wide text-zinc-500",
                      locale === "en" ? "uppercase" : "",
                    )}
                  >
                    {project4AssistantQuickPromptCategoryLabel(cat, locale)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const copy = project4AssistantQuickPromptCopy(item, locale);
                      return (
                        <TRNMenuItemButton
                          key={item.id}
                          type="button"
                          tone="subtle"
                          role="menuitem"
                          className="py-1.5 text-[11px] leading-snug"
                          label={copy.label}
                          title={copy.prompt.length > 120 ? `${copy.prompt.slice(0, 118)}…` : copy.prompt}
                          onClick={() => pick(copy.prompt)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TRNMenuPanel>
        </div>
      ) : null}
    </div>
  );
}
