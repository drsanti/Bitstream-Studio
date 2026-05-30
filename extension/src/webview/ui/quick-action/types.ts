import type { LucideIcon } from "lucide-react";

export interface Command
{
  id: string;
  label: string;
  keywords?: string[];
  icon?: LucideIcon;
  category?: string;
  shortcut?: string;
  action: () => void | Promise<void>;
  disabled?: boolean;
}

export interface FilteredCommand extends Command
{
  matchScore: number;
  matchedText?: string;
}
