import React, { useEffect, useRef } from "react";
import { Button } from "../Button";

export interface OutputPanelProps {
  lines: string[];
  onClear: () => void;
  viewMode: "text" | "hex";
  onViewModeChange: (mode: "text" | "hex") => void;
  maxLines?: number;
}

const OUTPUT_VIEWPORT_HEIGHT_PX = 220;

export function OutputPanel({
  lines,
  onClear,
  viewMode,
  onViewModeChange,
}: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm flex flex-col flex-1 min-h-0">
      <div className="p-4 border-b border-gray-700 shrink-0">
        <h3 className="text-lg font-semibold">Output (MCU → UI)</h3>
      </div>
      <div className="p-4 flex flex-col overflow-hidden flex-1 min-h-0">
        <div className="flex justify-between items-center shrink-0 gap-2 mb-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onViewModeChange("text")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === "text"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("hex")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === "hex"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Hex
            </button>
          </div>
          <Button
            variant="secondary"
            onClick={onClear}
            className="py-1! px-3! text-sm"
          >
            Clear
          </Button>
        </div>
        <div
          ref={scrollRef}
          className="bg-gray-900 rounded px-3 py-2 overflow-y-auto font-mono text-sm whitespace-pre-wrap break-all text-lime-300 shrink-0"
          style={{ height: OUTPUT_VIEWPORT_HEIGHT_PX }}
        >
          {lines.length === 0 ? (
            <p className="text-gray-500">No output yet. Run a command.</p>
          ) : (
            lines.map((line, i) => (
              <div key={i} className="text-lime-300">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
