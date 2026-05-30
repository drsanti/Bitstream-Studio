import type { HTMLAttributes, ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export type TRNSortableLayout = "vertical" | "horizontal" | "grid";

export type TRNSortableContainerProps = HTMLAttributes<HTMLDivElement> & {
  itemIds: string[];
  onReorder: (nextItemIds: string[]) => void;
  layout?: TRNSortableLayout;
  children: ReactNode;
};

export function TRNSortableContainer(props: TRNSortableContainerProps) {
  const {
    itemIds,
    onReorder,
    layout = "vertical",
    children,
    className,
    ...divProps
  } = props;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const strategy =
    layout === "horizontal"
      ? horizontalListSortingStrategy
      : layout === "grid"
        ? rectSortingStrategy
        : verticalListSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event: DragEndEvent) => {
        const { active, over } = event;
        if (over == null || active.id === over.id) {
          return;
        }
        const oldIndex = itemIds.findIndex((id) => id === active.id);
        const newIndex = itemIds.findIndex((id) => id === over.id);
        if (oldIndex < 0 || newIndex < 0) {
          return;
        }
        onReorder(arrayMove(itemIds, oldIndex, newIndex));
      }}
    >
      <SortableContext items={itemIds} strategy={strategy}>
        <div className={className} {...divProps}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}
