import { BookOpen } from "lucide-react";
import { TRNButton } from "../../../../../ui/TRN";
import type { StudioDemoTemplateId } from "../../store/flow-editor.store";
import { openFlowLibraryOfficial } from "../../flow-library/flow-library-navigation";
import { useStudioWorkbenchShell } from "../../workbench/studio-workbench-context";

export type FlowLibraryOpenLinkProps = {
  templateId: StudioDemoTemplateId;
  label?: string;
  className?: string;
};

export function FlowLibraryOpenLink(props: FlowLibraryOpenLinkProps) {
  const { templateId, label = "Browse in Library", className } = props;
  const { onFocusWorkbenchPane } = useStudioWorkbenchShell();

  if (onFocusWorkbenchPane == null) {
    return null;
  }

  return (
    <TRNButton
      type="button"
      size="compact"
      className={className}
      hint="Open Library → Presets → Flows → Official and highlight this starter graph."
      onClick={() => {
        openFlowLibraryOfficial(onFocusWorkbenchPane, templateId);
      }}
    >
      <BookOpen className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
      {label}
    </TRNButton>
  );
}
