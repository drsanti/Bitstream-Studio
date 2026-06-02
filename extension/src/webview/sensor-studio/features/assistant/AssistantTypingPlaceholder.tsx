import { AssistantWorkingGlyph } from "./AssistantWorkingGlyph";
import { formatAssistantElapsed } from "./formatAssistantElapsed";

export type AssistantTypingPlaceholderProps = {
  elapsedMs: number;
};

/** Assistant bubble body shown until the first streamed token arrives. */
export function AssistantTypingPlaceholder(props: AssistantTypingPlaceholderProps) {
  const { elapsedMs } = props;
  const elapsedLabel = formatAssistantElapsed(elapsedMs);

  return (
    <div
      className="flex flex-col gap-1"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Working on your reply, elapsed ${elapsedLabel}`}
    >
      <div className="flex items-center gap-2 text-zinc-300">
        <AssistantWorkingGlyph />
        <span className="text-[13px] font-medium text-zinc-200">Working on your reply</span>
      </div>
      <div className="flex items-baseline gap-2 pl-6 text-[11px] text-zinc-500">
        <span className="text-zinc-600">Elapsed</span>
        <span className="font-medium text-zinc-400">{elapsedLabel}</span>
      </div>
    </div>
  );
}
