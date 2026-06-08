import { BookOpen } from "lucide-react";
import { TRNButton } from "../../../../../ui/TRN";
import { openGroupLibraryProjectAsset } from "../../flow-library/flow-library-navigation";
import { useStudioWorkbenchShell } from "../../workbench/studio-workbench-context";

export type GroupLibraryOpenLinkProps = {
  assetId: string;
  label?: string;
  className?: string;
};

export function GroupLibraryOpenLink(props: GroupLibraryOpenLinkProps) {
  const { assetId, label = "Browse in Library", className } = props;
  const { onFocusWorkbenchPane } = useStudioWorkbenchShell();

  if (onFocusWorkbenchPane == null) {
    return null;
  }

  return (
    <TRNButton
      type="button"
      size="compact"
      className={className}
      hint="Open Library → Presets → Groups → Project and highlight this saved preset."
      onClick={() => {
        openGroupLibraryProjectAsset(onFocusWorkbenchPane, assetId);
      }}
    >
      <BookOpen className="mr-1 inline h-3 w-3 opacity-80" aria-hidden />
      {label}
    </TRNButton>
  );
}
