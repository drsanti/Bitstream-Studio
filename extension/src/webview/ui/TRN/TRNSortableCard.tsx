import { TRNCard } from "./TRNCard.js";
import type { TRNCardProps } from "./TRNCard.js";
import { TRNDragHandle } from "./TRNDragHandle.js";
import { TRNSortableItem } from "./TRNSortableItem.js";
import type { TRNSortableItemProps } from "./TRNSortableItem.js";

export type TRNSortableCardProps = Omit<TRNCardProps, "rightSlot"> & {
  id: string;
  sortableClassName?: TRNSortableItemProps["className"];
  dragFx?: TRNSortableItemProps["dragFx"];
  sortableDisabled?: boolean;
  handlePosition?: "left" | "right" | "none";
  customRightSlot?: TRNCardProps["rightSlot"];
};

export function TRNSortableCard(props: TRNSortableCardProps) {
  const {
    id,
    sortableClassName,
    dragFx = "tilt",
    sortableDisabled = false,
    handlePosition = "left",
    customRightSlot,
    icon,
    headerClassName,
    ...cardProps
  } = props;
  const mergedHeaderClassName =
    (handlePosition === "left" ? "pl-1" : "") +
    (headerClassName != null ? ` ${headerClassName}` : "");

  return (
    <TRNSortableItem
      id={id}
      className={sortableClassName}
      dragFx={dragFx}
      disabled={sortableDisabled}
    >
      <TRNCard
        {...cardProps}
        headerClassName={mergedHeaderClassName}
        icon={
          <>
            {handlePosition === "left" ? <TRNDragHandle /> : null}
            {icon}
          </>
        }
        rightSlot={
          <>
            {customRightSlot}
            {handlePosition === "right" ? <TRNDragHandle /> : null}
          </>
        }
      />
    </TRNSortableItem>
  );
}
