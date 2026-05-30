import { CircleHelp } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { PROJECT4_FLOATING_WINDOW_BODY_FONT_CLASS } from "../../lib/project4-floating-window-typography";
import { TRNMarkdownRenderer } from "../../../ui/TRN/TRNMarkdownRenderer.js";
import { TRNWindow } from "../../../ui/TRN/TRNWindow.js";
import { DIGITAL_TWIN_COPILOT_HELP_MARKDOWN } from "./digitalTwinCopilotHelpMarkdown.js";

export function Project4DigitalTwinCopilotHelpWindow(props: {
  open: boolean;
  onClose: () => void;
  persistRectStorageKey?: string;
}) {
  return (
    <TRNWindow
      open={props.open}
      title="Digital Twin Copilot — Help"
      prefixIcon={
        <CircleHelp className="h-3.5 w-3.5 text-sky-400/85" strokeWidth={2.5} aria-hidden />
      }
      onClose={props.onClose}
      modal={false}
      zIndex={100}
      reopenStrategy="preserve"
      draggable
      resizable
      heightMode="auto"
      autoHeightMaxViewportFraction={0.88}
      showFooter={false}
      persistRectStorageKey={props.persistRectStorageKey}
      initialRect={{ x: 72, y: 48, width: 560, height: 560 }}
      glass={false}
      contentClassName={twMerge(
        PROJECT4_FLOATING_WINDOW_BODY_FONT_CLASS,
        "bg-zinc-950 flex min-h-0 flex-1 flex-col overflow-hidden p-0 max-h-[min(88vh,760px)]",
      )}
      contentStyle={{ backgroundColor: "rgb(9 9 11)" }}
    >
      <div className="scrollbar-dark-small min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <TRNMarkdownRenderer
          markdown={DIGITAL_TWIN_COPILOT_HELP_MARKDOWN}
          tone="info"
          scrollbars="dark-small"
          className="text-xs"
        />
      </div>
    </TRNWindow>
  );
}
