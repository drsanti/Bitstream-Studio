import type { ReactNode } from "react";

/** Canonical slide canvas layouts — pick one per slide. */
export type SlideLayoutId =
  | "stack"
  | "full-center"
  | "split-50"
  | "split-40-60"
  | "split-60-40"
  | "hero-title"
  | "demo-rail"
  | "table-focus"
  | "grid-2x2"
  | "grid-2x3"
  | "immersive";

export type SlideHeadingSpec = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: "cyan" | "amber" | "purple" | "green";
};

export type SlidePageProps = {
  layout: SlideLayoutId;
  heading?: SlideHeadingSpec;
  footer?: ReactNode;
  /** Primary column / full-width body */
  main?: ReactNode;
  /** Secondary visual column (split layouts) */
  visual?: ReactNode;
  /** demo-rail: scene column */
  scene?: ReactNode;
  children?: ReactNode;
  className?: string;
};
