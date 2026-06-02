import { ListChecks } from "lucide-react";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { useStartupChecklistStore } from "./startupChecklist.store.js";

export function StartupSetupIncompleteChip() {
  const openPanel = useStartupChecklistStore((s) => s.openPanel);

  return (
    <div className="pointer-events-auto fixed bottom-14 left-1/2 z-[90] -translate-x-1/2">
      <TRNButton
        size="compact"
        selected
        prefixIcon={<ListChecks className="h-3.5 w-3.5" aria-hidden />}
        onClick={openPanel}
        className="border-amber-500/35 bg-amber-950/80 shadow-lg"
      >
        Setup incomplete — open checklist
      </TRNButton>
    </div>
  );
}
