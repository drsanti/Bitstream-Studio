import { Plus } from "lucide-react";
import { useState } from "react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormSection } from "../../ui/TRN/TRNForm";
import { prepareNewCourseDiagram } from "../content/diagramTemplates";
import { createPageBlock, PAGE_BLOCK_PALETTE } from "./blockFactory";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CourseBlockPalette({ embedded = false }: { embedded?: boolean }) {
  const page = useCoursePageEditorStore((s) => s.page);
  const addBlock = useCoursePageEditorStore((s) => s.addBlock);
  const [addingDiagram, setAddingDiagram] = useState(false);

  if (page == null) {
    return null;
  }

  async function handleAddBlock(kind: (typeof PAGE_BLOCK_PALETTE)[number]["kind"]) {
    if (kind === "diagram-2d") {
      setAddingDiagram(true);
      try {
        const { diagramId } = await prepareNewCourseDiagram("blank");
        addBlock(createPageBlock(kind, page!, { diagramId }));
      } finally {
        setAddingDiagram(false);
      }
      return;
    }
    addBlock(createPageBlock(kind, page!));
  }

  const body = (
    <div className="flex flex-wrap gap-1.5">
      {PAGE_BLOCK_PALETTE.map((entry) => (
        <TRNButton
          key={entry.kind}
          size="compact"
          className="gap-1 px-2 py-1 text-2xs"
          disabled={entry.kind === "diagram-2d" && addingDiagram}
          onClick={() => void handleAddBlock(entry.kind)}
        >
          <Plus size={12} strokeWidth={2.5} aria-hidden />
          {entry.label}
        </TRNButton>
      ))}
    </div>
  );

  if (embedded) {
    return <TRNFormSection title="Add block">{body}</TRNFormSection>;
  }

  return (
    <div className="border-b border-[var(--surface-border)] px-4 py-3">
      <TRNFormSection title="Add block" showHeading={false} className="border-0 bg-transparent p-0">
        {body}
      </TRNFormSection>
    </div>
  );
}
