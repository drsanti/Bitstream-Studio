import { memo } from "react";
import { TRNCommandPalette } from "../TRN/TRNCommandPalette.js";

type WorkbenchCommandOverlayProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (commandId: string) => void;
  items: Parameters<typeof TRNCommandPalette>[0]["items"];
  title?: string;
};

/** Modal command palette for workbench layout + pane commands. */
export const WorkbenchCommandOverlay = memo(function WorkbenchCommandOverlay({
  open,
  onClose,
  onSelect,
  items,
  title = "Workbench commands",
}: WorkbenchCommandOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[6000] flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/50">
        <TRNCommandPalette
          open={open}
          onClose={onClose}
          onSelect={onSelect}
          items={items}
          title={title}
          placeholder="Search layout or pane commands…"
          zIndex={6001}
        />
      </div>
    </div>
  );
});
