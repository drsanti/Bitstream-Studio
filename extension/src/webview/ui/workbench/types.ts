import type { ComponentType, ReactNode } from "react";

export type EditorType = string;

export type LayoutNode =
  | {
      id: string;
      type: "split";
      direction: "vertical" | "horizontal";
      ratio: number;
      first: LayoutNode;
      second: LayoutNode;
    }
  | {
      id: string;
      type: "editor";
      editorType: EditorType;
    };

export type WorkbenchRegistry = Record<
  string,
  {
    icon: ReactNode;
    label: string;
    component: ComponentType;
  }
>;
