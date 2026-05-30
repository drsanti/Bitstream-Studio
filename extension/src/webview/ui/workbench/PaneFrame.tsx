import { Columns2, Rows3, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { TRNMenuSectionTitle } from "../TRN/TRNMenu.js";
import type { LayoutNode, WorkbenchRegistry } from "./types";

interface PaneFrameProps {
  node: Extract<LayoutNode, { type: "editor" }>;
  registry: WorkbenchRegistry;
  onSplit: (direction: "horizontal" | "vertical") => void;
  onClose: () => void;
  onChangeType: (type: string) => void;
}

export function PaneFrame({ node, registry, onSplit, onClose, onChangeType }: PaneFrameProps) {
  const [showSelector, setShowSelector] = useState(false);
  const currentInfo = registry[node.editorType] ?? {
    icon: null as ReactNode,
    label: "Unknown",
    component: () => (
      <div className="p-5 text-sm text-zinc-500">Panel type is not registered in the workbench.</div>
    ),
  };

  const Content = currentInfo.component;

  return (
    <div className="workbench-pane flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div
        className="workbench-header relative z-100 flex h-7 shrink-0 items-center gap-2 border-b px-2"
        style={{
          background: "var(--workbench-header-bg, rgba(20,20,25,0.85))",
          borderColor: "var(--workbench-border, rgba(255,255,255,0.08))",
          backdropFilter: "blur(10px)",
        }}
      >
        <button
          type="button"
          onClick={() => setShowSelector((v) => !v)}
          className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-white/10"
          style={{
            background: showSelector ? "var(--workbench-accent, #3498db)" : "transparent",
          }}
        >
          <span className="flex size-4 items-center justify-center text-zinc-200">{currentInfo.icon}</span>
          <span className="text-[10px] opacity-70">▾</span>
        </button>

        <TRNMenuSectionTitle spacing="labelOnly">{currentInfo.label}</TRNMenuSectionTitle>

        <div className="min-w-0 flex-1" />

        <div className="workbench-controls flex gap-1">
          <button
            type="button"
            title="Split vertically"
            onClick={() => onSplit("vertical")}
            className="workbench-control-btn rounded p-1"
          >
            <Rows3 className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            title="Split horizontally"
            onClick={() => onSplit("horizontal")}
            className="workbench-control-btn rounded p-1"
          >
            <Columns2 className="size-3.5" aria-hidden />
          </button>
          <button type="button" title="Close pane" onClick={onClose} className="workbench-control-btn close rounded p-1">
            <X className="size-3.5" aria-hidden />
          </button>
        </div>

        {showSelector ? (
          <div
            className="workbench-selector-menu absolute left-2 top-8 z-1000 w-44 rounded-lg border p-1 shadow-xl"
            style={{
              background: "var(--workbench-header-bg, #1a1a1f)",
              borderColor: "var(--workbench-border, rgba(255,255,255,0.1))",
              backdropFilter: "blur(20px)",
            }}
          >
            {Object.entries(registry).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChangeType(key);
                  setShowSelector(false);
                }}
                className="workbench-menu-item flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs"
                style={{
                  color: node.editorType === key ? "var(--workbench-accent, #3498db)" : "rgb(244 244 245)",
                }}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">{info.icon}</span>
                <span>{info.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="workbench-content relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <Content />
      </div>
    </div>
  );
}
