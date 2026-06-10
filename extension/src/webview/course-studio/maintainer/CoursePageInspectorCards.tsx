import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  FileText,
  LayoutGrid,
  List,
  ListChecks,
  Package,
  PlusSquare,
} from "lucide-react";
import { CourseBlockPalette } from "./CourseBlockPalette";
import { CourseElementTestChecklist } from "./CourseElementTestChecklist";
import {
  CourseDocumentIdentityFields,
  CourseTelemetryLinkHealthFields,
} from "./CourseDocumentFieldGroups";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CoursePackControlsPanel } from "./CoursePackControlsPanel";
import { CoursePageBlockOutline } from "./CoursePageBlockOutline";
import { CoursePageGridInspectorFields } from "./CoursePageGridInspectorFields";
import {
  mergePageInspectorCardOrder,
  readPageInspectorCardCollapsed,
  readPageInspectorCardOrder,
  writePageInspectorCardCollapsed,
  writePageInspectorCardOrder,
  type CoursePageInspectorCardId,
} from "./course-page-inspector-ui-persistence";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CoursePageInspectorCards() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const selectedBlock =
    page?.blocks.find((block) => block.id === selectedBlockId) ?? null;

  const visibleCardIds = useMemo((): CoursePageInspectorCardId[] => {
    const ids: CoursePageInspectorCardId[] = [
      "add-block",
      "document-identity",
      "telemetry-link-health",
    ];
    if (import.meta.env.DEV) {
      ids.push("element-checklist", "presentation-pack");
    }
    return ids;
  }, []);

  const [cardOrder, setCardOrder] = useState<CoursePageInspectorCardId[]>(() =>
    mergePageInspectorCardOrder(readPageInspectorCardOrder(), visibleCardIds),
  );
  const [collapsedById, setCollapsedById] = useState<
    Record<CoursePageInspectorCardId, boolean>
  >(() => readPageInspectorCardCollapsed());
  const [contentGridCollapsed, setContentGridCollapsed] = useState(true);
  const [contextAddBlockCollapsed, setContextAddBlockCollapsed] = useState(false);
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);
  const [dragId, setDragId] = useState<CoursePageInspectorCardId | null>(null);

  useEffect(() => {
    setCardOrder((prev) => mergePageInspectorCardOrder(prev, visibleCardIds));
  }, [visibleCardIds]);

  const setCardCollapsed = (id: CoursePageInspectorCardId, collapsed: boolean) => {
    setCollapsedById((prev) => {
      const next = { ...prev, [id]: collapsed };
      writePageInspectorCardCollapsed(next);
      return next;
    });
  };

  const onDropCard = (targetId: CoursePageInspectorCardId) => {
    if (dragId == null || dragId === targetId) {
      return;
    }
    setCardOrder((prev) => {
      const next = prev.filter((id) => id !== dragId);
      const targetIdx = next.indexOf(targetId);
      if (targetIdx < 0) {
        return prev;
      }
      next.splice(targetIdx, 0, dragId);
      writePageInspectorCardOrder(next);
      return next;
    });
  };

  if (page == null) {
    return null;
  }

  const contentGridCard = (
    <CourseInspectorCard
      id="course-page-inspector-content-grid"
      title="Content grid"
      titleIcon={<LayoutGrid className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Page grid layout, composer guides, cell chrome, and published view styling."
      collapsible
      collapsed={contentGridCollapsed}
      onCollapsedChange={setContentGridCollapsed}
    >
      <CoursePageGridInspectorFields grid={page.grid} />
    </CourseInspectorCard>
  );

  const addBlockCard = (
    <CourseInspectorCard
      id="course-page-inspector-add-block"
      title="Add block"
      titleIcon={<PlusSquare className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Insert a new block onto the content grid."
      collapsible
      collapsed={
        selectedBlock != null ? contextAddBlockCollapsed : collapsedById["add-block"]
      }
      onCollapsedChange={(next) => {
        if (selectedBlock != null) {
          setContextAddBlockCollapsed(next);
          return;
        }
        setCardCollapsed("add-block", next);
      }}
    >
      <CourseBlockPalette bare />
    </CourseInspectorCard>
  );

  const cardsById: Record<CoursePageInspectorCardId, JSX.Element> = {
    "add-block": addBlockCard,
    "document-identity": (
      <CourseInspectorCard
        id="course-page-inspector-document-identity"
        title="Document identity"
        titleIcon={<FileText className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Page title and stable id."
        collapsible
        collapsed={collapsedById["document-identity"]}
        onCollapsedChange={(next) => setCardCollapsed("document-identity", next)}
      >
        <CourseDocumentIdentityFields />
      </CourseInspectorCard>
    ),
    "telemetry-link-health": (
      <CourseInspectorCard
        id="course-page-inspector-telemetry-link-health"
        title="Telemetry & link health"
        titleIcon={<Activity className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Route preference and stale-sample behavior."
        collapsible
        collapsed={collapsedById["telemetry-link-health"]}
        onCollapsedChange={(next) => setCardCollapsed("telemetry-link-health", next)}
      >
        <CourseTelemetryLinkHealthFields />
      </CourseInspectorCard>
    ),
    "presentation-pack": (
      <CourseInspectorCard
        id="course-page-inspector-presentation-pack"
        title="Presentation pack"
        titleIcon={<Package className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Import, reload, and switch pages in dev."
        collapsible
        collapsed={collapsedById["presentation-pack"]}
        onCollapsedChange={(next) => setCardCollapsed("presentation-pack", next)}
      >
        <CoursePackControlsPanel />
      </CourseInspectorCard>
    ),
    "element-checklist": (
      <CourseInspectorCard
        id="course-page-inspector-element-checklist"
        title="Element test checklist"
        titleIcon={<ListChecks className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Verify each block type on the page (dev QA)."
        collapsible
        collapsed={collapsedById["element-checklist"]}
        onCollapsedChange={(next) => setCardCollapsed("element-checklist", next)}
      >
        <CourseElementTestChecklist bare />
      </CourseInspectorCard>
    ),
  };

  const blockOutlineCard = (
    <CourseInspectorCard
      id="course-page-inspector-block-outline"
      title="Blocks"
      titleIcon={<List className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Select a block to edit in the Block inspector pane."
      collapsible
      collapsed={outlineCollapsed}
      onCollapsedChange={setOutlineCollapsed}
    >
      <CoursePageBlockOutline blocks={page.blocks} selectedBlockId={selectedBlockId} />
    </CourseInspectorCard>
  );

  const secondaryCardOrder = useMemo(
    () => cardOrder.filter((id) => id !== "add-block"),
    [cardOrder],
  );

  const renderDraggableCard = (id: CoursePageInspectorCardId) => (
    <div
      key={id}
      className="min-w-0"
      draggable
      onDragStart={(e) => {
        const header = (e.target as HTMLElement | null)?.closest?.("[data-trn-card-header]");
        if (header == null) {
          e.preventDefault();
          return;
        }
        setDragId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
      }}
      onDragEnd={() => setDragId(null)}
      onDragOver={(e) => {
        if (dragId == null || dragId === id) {
          return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropCard(id);
      }}
    >
      {cardsById[id]}
    </div>
  );

  if (selectedBlock != null) {
    return (
      <div className="space-y-2">
        {addBlockCard}
        {blockOutlineCard}
        {contentGridCard}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {renderDraggableCard("add-block")}
      {blockOutlineCard}
      {secondaryCardOrder.map((id) => renderDraggableCard(id))}
      {contentGridCard}
    </div>
  );
}
