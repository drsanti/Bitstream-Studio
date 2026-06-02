import { useEffect, useState } from "react";

export type FlowConnectDragHintProps = {
  active: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

const HINT_SHOW_DELAY_MS = 160;

export function FlowConnectDragHint(props: FlowConnectDragHintProps) {
  const { active, shiftKey, altKey } = props;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), HINT_SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!active || !visible) {
    return null;
  }

  const primary = shiftKey
    ? "Shift — full Add menu"
    : altKey
      ? "Alt — place without auto-connect"
      : "Release on empty canvas to add a compatible node";

  const secondary =
    shiftKey || altKey
      ? null
      : "Hold Shift for full menu · Alt to skip auto-connect";

  return (
    <div
      className="pointer-events-none absolute bottom-3 left-1/2 z-30 max-w-[min(92vw,520px)] -translate-x-1/2 rounded-md border border-zinc-700/80 bg-zinc-950/90 px-3 py-1.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
      aria-live="polite"
    >
      <p className="text-[11px] font-medium text-zinc-200">{primary}</p>
      {secondary != null ? (
        <p className="mt-0.5 text-[10px] text-zinc-500">{secondary}</p>
      ) : null}
    </div>
  );
}
