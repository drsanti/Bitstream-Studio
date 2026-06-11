import { Pin } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNIconButton } from "../../../../../ui/TRN";

export type InspectorPinToggleProps = {
  isPinned: boolean;
  canPin: boolean;
  pinLabel: string | null;
  onPin: () => void;
  onUnpin: () => void;
};

export function InspectorPinToggle(props: InspectorPinToggleProps) {
  const { isPinned, canPin, pinLabel, onPin, onUnpin } = props;

  const targetName = pinLabel?.trim() ?? "this target";
  const hint = isPinned
    ? `Pinned · ${targetName} — click to unpin.`
    : canPin
      ? `Pin inspector — keep ${targetName} while you work in other panes.`
      : "Select a node, Dashboard widget, or Stage object to pin.";

  return (
    <TRNIconButton
      icon={
        <Pin
          className={twMerge(
            "size-3.5",
            isPinned ? "fill-amber-400/90 text-amber-400" : "text-zinc-400",
          )}
          aria-hidden
        />
      }
      label={isPinned ? `Unpin inspector (${targetName})` : "Pin inspector"}
      hint={hint}
      disabled={!isPinned && !canPin}
      onClick={() => (isPinned ? onUnpin() : onPin())}
      variant="ghost"
      nativeTitle={false}
      className={twMerge(
        "!h-7 !w-7 shrink-0",
        isPinned && "bg-amber-950/35 text-amber-400 hover:bg-amber-950/50 hover:text-amber-300",
      )}
    />
  );
}
