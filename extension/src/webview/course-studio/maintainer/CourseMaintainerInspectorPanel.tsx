import { useCallback, useEffect, useState } from "react";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
} from "../../ui/TRN";
import { CourseBlockInspector } from "./CourseBlockInspector";
import { CourseBlockPalette } from "./CourseBlockPalette";
import { CourseDiagramJsonEditor } from "./CourseDiagramJsonEditor";
import { CourseDocumentSettingsPanel } from "./CourseDocumentSettingsPanel";
import {
  COURSE_MAINTAINER_TABS,
  readStoredCourseMaintainerTab,
  writeStoredCourseMaintainerTab,
  type CourseMaintainerTab,
} from "./courseMaintainerInspectorUi";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CourseMaintainerInspectorPanel() {
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const page = useCoursePageEditorStore((s) => s.page);
  const block = page?.blocks.find((b) => b.id === selectedBlockId) ?? null;
  const diagramBlock = block?.kind === "diagram-2d" ? block : null;

  const [activeTab, setActiveTab] = useState<CourseMaintainerTab>(() =>
    readStoredCourseMaintainerTab(),
  );

  const setActiveTabPersisted = useCallback((next: CourseMaintainerTab) => {
    setActiveTab(next);
    writeStoredCourseMaintainerTab(next);
  }, []);

  useEffect(() => {
    if (diagramBlock != null) {
      setActiveTabPersisted("diagram");
    }
  }, [selectedBlockId, diagramBlock, setActiveTabPersisted]);

  return (
    <div className="mx-2 mb-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
      <TRNTabs
        value={activeTab}
        onValueChange={(next) => setActiveTabPersisted(next as CourseMaintainerTab)}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
      >
        <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
          <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
            {COURSE_MAINTAINER_TABS.map(({ id, label, Icon }) => (
              <TRNTabsTrigger key={id} value={id} className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
                {label}
              </TRNTabsTrigger>
            ))}
          </TRNTabsList>
        </div>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2">
          {activeTab === "page" ? (
            <div className="flex flex-col gap-3">
              <CourseDocumentSettingsPanel embedded />
              <CourseBlockPalette embedded />
            </div>
          ) : null}

          {activeTab === "block" ? (
            <CourseBlockInspector variant="block" />
          ) : null}

          {activeTab === "diagram" ? (
            diagramBlock != null ? (
              <CourseDiagramJsonEditor diagramId={diagramBlock.diagramId} embedded />
            ) : (
              <CourseBlockInspector variant="diagram-empty" />
            )
          ) : null}
        </div>
      </TRNTabs>
    </div>
  );
}
