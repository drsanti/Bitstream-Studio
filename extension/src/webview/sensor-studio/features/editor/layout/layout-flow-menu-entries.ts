import { Frame, GitMerge, Split, StickyNote } from "lucide-react";
import type { LayoutMenuEntryId } from "../layout/layout-flow-nodes.types";

export const FLOW_LAYOUT_MENU_LAYOUT = "__layout__" as const;

export type LayoutMenuEntry = {
  id: LayoutMenuEntryId;
  title: string;
  description: string;
  shortcut?: string;
  icon: typeof GitMerge;
};

export const LAYOUT_MENU_ENTRIES: LayoutMenuEntry[] = [
  {
    id: "reroute",
    title: "Reroute",
    description: "Passthrough wire junction",
    shortcut: "R",
    icon: GitMerge,
  },
  {
    id: "split",
    title: "Split",
    description: "Broadcast one wire to many outputs",
    icon: Split,
  },
  {
    id: "frame",
    title: "Frame",
    description: "Group and label a canvas region",
    icon: Frame,
  },
  {
    id: "note",
    title: "Note",
    description: "Sticky comment (no wires)",
    icon: StickyNote,
  },
];
