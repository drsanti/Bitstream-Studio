import { useEffect, useRef } from "react";

export function KonvaTextEditOverlay({
  left,
  top,
  width,
  fontSize,
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  left: number;
  top: number;
  width: number;
  fontSize: number;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input == null) {
      return;
    }
    input.focus();
    input.select();
  }, []);

  return (
    <textarea
      ref={inputRef}
      className="absolute z-20 resize-none rounded border border-cyan-500/60 bg-black/90 px-1 py-0.5 text-[var(--text-primary)] outline-none"
      style={{
        left,
        top,
        width: Math.max(120, width),
        minHeight: fontSize * 1.4,
        fontSize,
        lineHeight: 1.25,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onCommit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
    />
  );
}
