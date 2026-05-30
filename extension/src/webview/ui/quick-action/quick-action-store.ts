import { create } from "zustand";
import type { Command, FilteredCommand } from "./types.js";

export interface QuickActionState
{
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  commands: Command[];
  registerCommand: (command: Command) => void;
  unregisterCommand: (id: string) => void;
  recentCommandIds: string[];
  recordExecution: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  resetSelection: () => void;
  getFilteredCommands: () => FilteredCommand[];
}

/* Fuzzy match query against command label / keywords / category. */
function fuzzyMatch(
  query: string,
  text: string,
): { score: number; matched: boolean }
{
  if (!query)
  {
    return { score: 0, matched: true };
  }

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  if (normalizedText === normalizedQuery)
  {
    return { score: 100, matched: true };
  }

  if (normalizedText.startsWith(normalizedQuery))
  {
    return { score: 80, matched: true };
  }

  if (normalizedText.includes(normalizedQuery))
  {
    return { score: 60, matched: true };
  }

  let queryIndex = 0;
  for (
    let i = 0;
    i < normalizedText.length && queryIndex < normalizedQuery.length;
    i++
  )
  {
    if (normalizedText[i] === normalizedQuery[queryIndex])
    {
      queryIndex++;
    }
  }

  if (queryIndex === normalizedQuery.length)
  {
    return { score: 40, matched: true };
  }

  return { score: 0, matched: false };
}

function filterCommands(commands: Command[], query: string): FilteredCommand[]
{
  if (!query.trim())
  {
    return commands.map((cmd) => ({ ...cmd, matchScore: 0 }));
  }

  const filtered: FilteredCommand[] = [];

  for (const command of commands)
  {
    if (command.disabled)
    {
      continue;
    }

    let bestScore = 0;
    let matchedText = "";

    const labelMatch = fuzzyMatch(query, command.label);
    if (labelMatch.matched && labelMatch.score > bestScore)
    {
      bestScore = labelMatch.score;
      matchedText = command.label;
    }

    if (command.keywords)
    {
      for (const keyword of command.keywords)
      {
        const keywordMatch = fuzzyMatch(query, keyword);
        if (keywordMatch.matched && keywordMatch.score > bestScore)
        {
          bestScore = keywordMatch.score;
          matchedText = keyword;
        }
      }
    }

    if (command.category)
    {
      const categoryMatch = fuzzyMatch(query, command.category);
      if (categoryMatch.matched && categoryMatch.score > bestScore)
      {
        bestScore = categoryMatch.score;
        matchedText = command.category;
      }
    }

    if (bestScore > 0)
    {
      filtered.push({
        ...command,
        matchScore: bestScore,
        matchedText,
      });
    }
  }

  return filtered.sort((a, b) =>
  {
    if (b.matchScore !== a.matchScore)
    {
      return b.matchScore - a.matchScore;
    }
    return a.label.localeCompare(b.label);
  });
}

export const useQuickActionStore = create<QuickActionState>((set, get) => ({
  open: false,
  commands: [],
  recentCommandIds: [],

  setOpen: (open: boolean) =>
  {
    set({ open });
    if (open)
    {
      set({ searchQuery: "", selectedIndex: 0 });
    }
  },

  toggle: () =>
  {
    const { open } = get();
    get().setOpen(!open);
  },

  registerCommand: (command: Command) =>
  {
    set((state) =>
    {
      const exists = state.commands.some((cmd) => cmd.id === command.id);
      if (exists)
      {
        console.warn(
          `[QuickAction] Command with id "${command.id}" already exists. Overwriting.`,
        );
        return {
          commands: state.commands.map((cmd) =>
            cmd.id === command.id ? command : cmd,
          ),
        };
      }
      return {
        commands: [...state.commands, command],
      };
    });
  },

  unregisterCommand: (id: string) =>
  {
    set((state) => ({
      commands: state.commands.filter((cmd) => cmd.id !== id),
      recentCommandIds: state.recentCommandIds.filter((cmdId) => cmdId !== id),
    }));
  },

  recordExecution: (id: string) =>
  {
    set((state) =>
    {
      const commandExists = state.commands.some((cmd) => cmd.id === id);
      if (!commandExists)
      {
        return {};
      }

      const deduped = state.recentCommandIds.filter(
        (cmdId) =>
          cmdId !== id && state.commands.some((cmd) => cmd.id === cmdId),
      );
      return {
        recentCommandIds: [id, ...deduped].slice(0, 3),
      };
    });
  },

  searchQuery: "",
  setSearchQuery: (query: string) =>
  {
    set({ searchQuery: query, selectedIndex: 0 });
  },

  selectedIndex: 0,
  setSelectedIndex: (index: number) =>
  {
    const filteredCommands = get().getFilteredCommands();
    const maxIndex = Math.max(0, filteredCommands.length - 1);
    set({ selectedIndex: Math.max(0, Math.min(index, maxIndex)) });
  },

  resetSelection: () =>
  {
    set({ selectedIndex: 0 });
  },

  getFilteredCommands: () =>
  {
    const { commands, searchQuery } = get();
    return filterCommands(commands, searchQuery);
  },
}));
