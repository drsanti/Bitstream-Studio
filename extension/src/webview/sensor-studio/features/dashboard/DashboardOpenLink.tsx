import { LayoutGrid } from "lucide-react";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { useStudioWorkbenchShell } from "../editor/workbench/studio-workbench-context";
import { openDashboard } from "./dashboard-navigation";

export type DashboardOpenLinkProps = {
  label?: string;
  sourceNodeId?: string | null;
  className?: string;
};

export function DashboardOpenLink(props: DashboardOpenLinkProps) {
  const { label = "Open Dashboard", className, sourceNodeId } = props;
  const { onFocusWorkbenchPane } = useStudioWorkbenchShell();

  if (onFocusWorkbenchPane == null) {
    return null;
  }

  return (
    <TRNButton
      type="button"
      size="compact"
      className={className}
      hint="Focus the Dashboard workbench pane and highlight this widget when placed."
      onClick={() => {
        openDashboard(onFocusWorkbenchPane, { sourceNodeId });
      }}
    >
      <LayoutGrid className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
      {label}
    </TRNButton>
  );
}
