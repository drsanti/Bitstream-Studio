import { GitMerge, Replace } from "lucide-react";
import { createPortal } from "react-dom";
import { TRNButton } from "../../../../../ui/TRN";

export type FlowLoadMode = "replace" | "merge";

export type FlowLoadModeDialogProps = {
  open: boolean;
  presetName: string;
  onChoose: (mode: FlowLoadMode) => void;
  onCancel: () => void;
};

export function FlowLoadModeDialog(props: FlowLoadModeDialogProps) {
  const { open, presetName, onChoose, onCancel } = props;

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="flow-load-mode-title"
        className="w-full max-w-md rounded-xl border border-zinc-700/70 bg-zinc-950/90 px-5 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="flow-load-mode-title" className="text-sm font-semibold text-zinc-100">
          Load flow preset
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          How should <span className="text-zinc-200">{presetName}</span> be applied to the canvas?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <TRNButton
            size="compact"
            selected
            className="w-full justify-start"
            prefixIcon={<Replace className="h-3.5 w-3.5" aria-hidden />}
            hint="Clear the current graph and load this preset."
            onClick={() => onChoose("replace")}
          >
            Replace canvas
          </TRNButton>
          <TRNButton
            size="compact"
            className="w-full justify-start"
            prefixIcon={<GitMerge className="h-3.5 w-3.5" aria-hidden />}
            hint="Keep existing nodes and paste this preset with new ids."
            onClick={() => onChoose("merge")}
          >
            Merge into canvas
          </TRNButton>
        </div>
        <div className="mt-4 flex justify-end">
          <TRNButton size="compact" onClick={onCancel}>
            Cancel
          </TRNButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
