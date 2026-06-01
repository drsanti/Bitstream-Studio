import { useEffect, type ReactNode } from "react";
import { useWorkspaceHeaderMenuSlotStore } from "../state/workspaceHeaderMenuSlot.store";

/** Mount workspace-specific sections into the shell header hamburger menu. */
export function useRegisterWorkspaceHeaderMenuSlot(sections: ReactNode): void {
  const setSections = useWorkspaceHeaderMenuSlotStore((s) => s.setSections);

  useEffect(() => {
    setSections(sections);
    return () => setSections(null);
  }, [sections, setSections]);
}
