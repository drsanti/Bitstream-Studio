import { useCallback, useMemo, useState } from "react";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import {
  TRNDragHandle,
  TRNInteractiveCard,
  TRNSortableContainer,
  TRNSortableItem,
} from "../../../../../ui/TRN";
import type { StudioNode } from "../../store/flow-editor.store";
import {
  type DetailsInspectorSectionId,
  mergeDetailsSectionOrder,
  readDetailsSectionCollapsed,
  readDetailsSectionOrder,
  writeDetailsSectionCollapsed,
  writeDetailsSectionOrder,
} from "./node-inspector-ui-persistence";
import {
  InspectorPortsTable,
  collectInspectorPortRows,
  formatInspectorPortsHint,
} from "./InspectorPortsTable";
import { InspectorAboutContent } from "./InspectorAboutContent";
import {
  catalogAboutLead,
  resolveSensorInspectorAboutForNode,
} from "./sensor-inspector-about-content";

const DETAILS_CARD_CLASS = "h-auto rounded-md border-zinc-700/80 bg-black/40 p-2";
const DETAILS_CARD_TITLE_CLASS = "normal-case tracking-normal text-zinc-100";

const DETAILS_DRAG_HANDLE = (
  <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
);

const SORTABLE_ITEM_PROPS = {
  dragFx: "playful" as const,
  dragFxOptions: {
    normalizeScale: true,
    playfulScale: 1,
    playfulMaxRotateDeg: 3,
  },
};

export type NodeInspectorDetailsTabProps = {
  selectedNode: StudioNode;
  catalogEntry: NodeCatalogEntry | undefined;
};

function DetailsDragLead() {
  return (
    <div className="inline-flex items-center gap-1">{DETAILS_DRAG_HANDLE}</div>
  );
}

export function NodeInspectorDetailsTab(props: NodeInspectorDetailsTabProps) {
  const { selectedNode, catalogEntry } = props;

  const [sectionOrder, setSectionOrder] = useState(readDetailsSectionOrder);
  const [collapsedCards, setCollapsedCards] = useState(readDetailsSectionCollapsed);

  const description = catalogEntry?.description?.trim() ?? "";
  const sensorAbout = useMemo(
    () => resolveSensorInspectorAboutForNode(selectedNode),
    [selectedNode],
  );
  const portRows = useMemo(
    () => collectInspectorPortRows(selectedNode),
    [selectedNode],
  );
  const portsHint = formatInspectorPortsHint(portRows);

  const visibleSectionIds = useMemo((): DetailsInspectorSectionId[] => {
    const ids: DetailsInspectorSectionId[] = [];
    if (description.length > 0 || sensorAbout != null) {
      ids.push("specs");
    }
    if (portRows.length > 0) {
      ids.push("ports");
    }
    return ids;
  }, [description, sensorAbout, portRows.length]);

  const displaySectionOrder = useMemo(
    () =>
      mergeDetailsSectionOrder(sectionOrder, visibleSectionIds).filter((id) =>
        visibleSectionIds.includes(id),
      ),
    [sectionOrder, visibleSectionIds],
  );

  const setSectionCollapsed = useCallback(
    (sectionId: DetailsInspectorSectionId, nextCollapsed: boolean) => {
      setCollapsedCards((previous) => {
        if (previous[sectionId] === nextCollapsed) {
          return previous;
        }
        const next = {
          ...previous,
          [sectionId]: nextCollapsed,
        };
        writeDetailsSectionCollapsed(next);
        return next;
      });
    },
    [],
  );

  const onReorderSections = useCallback(
    (nextItemIds: string[]) => {
      const nextVisible = nextItemIds as DetailsInspectorSectionId[];
      const hiddenTail = sectionOrder.filter((id) => !visibleSectionIds.includes(id));
      const merged = [...nextVisible, ...hiddenTail];
      setSectionOrder(merged);
      writeDetailsSectionOrder(merged);
    },
    [sectionOrder, visibleSectionIds],
  );

  const renderDetailsSection = (sectionId: DetailsInspectorSectionId) => {
    const collapsed = collapsedCards[sectionId];
    const cardProps = {
      className: DETAILS_CARD_CLASS,
      headerTitleClassName: DETAILS_CARD_TITLE_CLASS,
      titleLeadingSlot: <DetailsDragLead />,
      collapsible: true as const,
      collapsed,
      onCollapsedChange: (nextCollapsed: boolean) =>
        setSectionCollapsed(sectionId, nextCollapsed),
      contentClassName: "min-h-0 pt-1",
    };

    if (sectionId === "specs") {
      return (
        <TRNInteractiveCard title="Specifications" {...cardProps}>
          {sensorAbout != null ? (
            <InspectorAboutContent
              content={sensorAbout}
              catalogLead={catalogAboutLead(description)}
            />
          ) : (
            <p className="text-[11px] leading-relaxed text-zinc-400">{description}</p>
          )}
        </TRNInteractiveCard>
      );
    }

    return (
      <TRNInteractiveCard
        title="Ports"
        titleTrailingSlot={
          portsHint.length > 0 ? (
            <span className="text-[10px] font-normal text-zinc-500">{portsHint}</span>
          ) : null
        }
        {...cardProps}
      >
        <InspectorPortsTable rows={portRows} />
      </TRNInteractiveCard>
    );
  };

  if (displaySectionOrder.length === 0) {
    return (
      <p className="text-[11px] leading-relaxed text-zinc-500">
        No details for this node type.
      </p>
    );
  }

  return (
    <TRNSortableContainer
      itemIds={displaySectionOrder}
      onReorder={onReorderSections}
      className="flex flex-col gap-2"
    >
      {displaySectionOrder.map((sectionId) => (
        <TRNSortableItem
          key={sectionId}
          id={sectionId}
          {...SORTABLE_ITEM_PROPS}
        >
          {renderDetailsSection(sectionId)}
        </TRNSortableItem>
      ))}
    </TRNSortableContainer>
  );
}
