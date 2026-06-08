import type { FC } from "react";

export type SlideMode = "theory" | "demo" | "lab";

export interface SlideDefinition {
  id: string;
  title: string;
  subtitle: string;
  mode: SlideMode;
  section: string;
  notes: () => Promise<{ default: string }>;
  Component: FC;
}

export interface ChapterDefinition {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  order: number;
  slides: SlideDefinition[];
}
