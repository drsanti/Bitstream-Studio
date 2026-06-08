import { TRNSidePanel } from "../../ui/TRN/TRNSidePanel";
import { CourseMaintainerInspectorPanel } from "./CourseMaintainerInspectorPanel";

export function CourseMaintainerSidePanel() {
  return (
    <TRNSidePanel
      side="right"
      mode="docked"
      variant="inspector"
      title="Maintainer"
      subtitle="Blocks · placement · diagrams"
      collapsedFloatingLabel="Maintainer"
      persistKey="course-studio:maintainer-inspector"
      defaultWidth={400}
      minWidth={280}
      maxWidth={680}
      collapsible
      resizable
      collapsedPresentation="floating-only"
      toggleHotkeys={["ctrl+\\", "cmd+\\"]}
      contentClassName="flex min-h-0 flex-col p-0"
      headerClassName="!border-[var(--surface-border)] !bg-[var(--surface-card)]"
      className="course-maintainer-side-panel h-full !border-[var(--surface-border)] !bg-[var(--surface-panel)]"
    >
      <CourseMaintainerInspectorPanel />
    </TRNSidePanel>
  );
}
