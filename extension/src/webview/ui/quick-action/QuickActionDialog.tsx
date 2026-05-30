/*******************************************************************************
 * File Name : QuickActionDialog.tsx
 *
 * Description : Command palette overlay for Ctrl+/ quick actions (fuzzy search,
 *               recent commands, keyboard navigation).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Command as CommandIcon, Search } from "lucide-react";
import { cn } from "../catalog/cn.js";
import { useQuickActionStore } from "./quick-action-store.js";
import type { FilteredCommand } from "./types.js";

export interface QuickActionDialogProps
{
  className?: string;
}

/**
 * Glass command palette; opens when {@link useQuickActionStore} `open` is true.
 */
export function QuickActionDialog({ className }: QuickActionDialogProps)
{
  const open = useQuickActionStore((state) => state.open);
  const setOpen = useQuickActionStore((state) => state.setOpen);
  const searchQuery = useQuickActionStore((state) => state.searchQuery);
  const setSearchQuery = useQuickActionStore((state) => state.setSearchQuery);
  const selectedIndex = useQuickActionStore((state) => state.selectedIndex);
  const setSelectedIndex = useQuickActionStore(
    (state) => state.setSelectedIndex,
  );
  const commands = useQuickActionStore((state) => state.commands);
  const getFilteredCommands = useQuickActionStore(
    (state) => state.getFilteredCommands,
  );
  const recordExecution = useQuickActionStore((state) => state.recordExecution);
  const recentCommandIds = useQuickActionStore(
    (state) => state.recentCommandIds,
  );

  const filteredCommands = useMemo(
    () => getFilteredCommands(),
    [getFilteredCommands, searchQuery, commands],
  );
  const showRecentCommands =
    !searchQuery.trim() && recentCommandIds.length > 0;
  const recentCommands = useMemo(() =>
  {
    if (!showRecentCommands)
    {
      return [];
    }
    return recentCommandIds
      .map((id) => filteredCommands.find((command) => command.id === id))
      .filter((command): command is FilteredCommand => Boolean(command));
  }, [filteredCommands, recentCommandIds, showRecentCommands]);

  const mainCommands = useMemo(() =>
  {
    if (!showRecentCommands)
    {
      return filteredCommands;
    }
    const recentSet = new Set(recentCommands.map((command) => command.id));
    return filteredCommands.filter((command) => !recentSet.has(command.id));
  }, [filteredCommands, recentCommands, showRecentCommands]);

  const visibleCommands = useMemo(
    () =>
      showRecentCommands
        ? [...recentCommands, ...mainCommands]
        : filteredCommands,
    [filteredCommands, mainCommands, recentCommands, showRecentCommands],
  );

  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  useEffect(() =>
  {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() =>
  {
    if (open && inputRef.current)
    {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  useEffect(() =>
  {
    if (selectedItemRef.current && listRef.current)
    {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) =>
    {
      if (event.key === "Escape")
      {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === "ArrowDown")
      {
        event.preventDefault();
        setSelectedIndex(selectedIndex + 1);
        return;
      }

      if (event.key === "ArrowUp")
      {
        event.preventDefault();
        setSelectedIndex(Math.max(0, selectedIndex - 1));
        return;
      }

      if (event.key === "Enter")
      {
        event.preventDefault();
        const command = visibleCommands[selectedIndex];
        if (command && !command.disabled)
        {
          void Promise.resolve(command.action()).then(() =>
          {
            recordExecution(command.id);
            setOpen(false);
          });
        }
      }
    },
    [
      recordExecution,
      selectedIndex,
      setOpen,
      setSelectedIndex,
      visibleCommands,
    ],
  );

  const handleCommandClick = useCallback(
    (command: FilteredCommand) =>
    {
      if (command.disabled)
      {
        return;
      }
      void Promise.resolve(command.action()).then(() =>
      {
        recordExecution(command.id);
        setOpen(false);
      });
    },
    [recordExecution, setOpen],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) =>
    {
      if (event.target === event.currentTarget)
      {
        setOpen(false);
      }
    },
    [setOpen],
  );

  const highlightText = useCallback((text: string, query: string) =>
  {
    if (!query.trim())
    {
      return <span>{text}</span>;
    }

    const normalizedQuery = query.toLowerCase();
    const normalizedText = text.toLowerCase();
    const index = normalizedText.indexOf(normalizedQuery);

    if (index === -1)
    {
      return <span>{text}</span>;
    }

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <>
        {before}
        <mark className="rounded bg-sky-500/25 px-0.5 text-sky-200">
          {match}
        </mark>
        {after}
      </>
    );
  }, []);

  if (!open || !mounted)
  {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[200] flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Quick commands"
    >
      <div
        className={cn(
          "flex max-h-[min(70vh,520px)] w-full max-w-2xl flex-col overflow-hidden",
          "rounded-lg border border-zinc-600/80 bg-zinc-900/95 text-zinc-100 shadow-2xl shadow-black/50",
          className,
        )}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-700/80 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
            <kbd className="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl
            </kbd>
            <span>/</span>
            <span className="hidden sm:inline">toggle</span>
            <span className="text-zinc-600">·</span>
            <kbd className="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">
              Esc
            </kbd>
          </div>
        </div>

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto scrollbar-hide"
          role="listbox"
          aria-label="Commands"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <CommandIcon
                className="mx-auto mb-3 h-12 w-12 text-zinc-600"
                aria-hidden
              />
              <p className="text-sm text-zinc-400">
                {searchQuery
                  ? `No commands match "${searchQuery}"`
                  : "No commands registered yet"}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {showRecentCommands && recentCommands.length > 0 && (
                <>
                  <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Recent
                  </div>
                  {recentCommands.map((command, index) =>
                    renderCommandItem(command, index),
                  )}
                  <div className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Commands
                  </div>
                  {mainCommands.map((command, index) =>
                    renderCommandItem(command, recentCommands.length + index),
                  )}
                </>
              )}
              {!showRecentCommands &&
                visibleCommands.map((command, index) =>
                  renderCommandItem(command, index),
                )}
            </div>
          )}
        </div>

        {visibleCommands.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-700/80 px-4 py-2 text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">
                  Enter
                </kbd>
                run
              </span>
            </div>
            <span>
              {visibleCommands.length} command
              {visibleCommands.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );

  function renderCommandItem(command: FilteredCommand, index: number)
  {
    const isSelected = index === selectedIndex;
    const Icon = command.icon;

    return (
      <div
        key={`${command.id}-${index}`}
        ref={isSelected ? selectedItemRef : null}
        className={cn(
          "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
          isSelected
            ? "bg-sky-500/15 text-zinc-50"
            : "text-zinc-300 hover:bg-zinc-800/80",
          command.disabled && "cursor-not-allowed opacity-45",
        )}
        onClick={() => handleCommandClick(command)}
        role="option"
        aria-selected={isSelected}
      >
        {Icon && (
          <Icon
            className={cn(
              "h-5 w-5 shrink-0",
              isSelected ? "text-sky-300" : "text-zinc-500",
            )}
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">
            {highlightText(command.label, searchQuery)}
          </div>
          {command.category && (
            <div className="mt-0.5 text-xs text-zinc-500">
              {command.category}
            </div>
          )}
        </div>
        {command.shortcut && (
          <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
            {command.shortcut.split("+").map((key, i, arr) => (
              <React.Fragment key={`${command.id}-kbd-${i}`}>
                <kbd className="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">
                  {key.trim()}
                </kbd>
                {i < arr.length - 1 && (
                  <span className="text-zinc-600">+</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }
}
