import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TRNSortableCard } from "./TRNSortableCard.js";
import { TRNSortableContainer } from "./TRNSortableContainer.js";
import {
  loadTrnSortableSettingsCardData,
  saveTrnSortableSettingsCardData,
} from "./trnSortableSettingsCardStorage.js";

export type TRNSortableSettingsCardItem = {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  defaultExpanded?: boolean;
};

export type TRNSortableSettingsCardListProps = {
  items: TRNSortableSettingsCardItem[];
  panelId: string;
  className?: string;
  persistState?: boolean;
};

export function TRNSortableSettingsCardList({
  items,
  panelId,
  className,
  persistState = true,
}: TRNSortableSettingsCardListProps) {
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemIdsString = useMemo(
    () => itemIds.slice().sort().join(","),
    [itemIds],
  );

  const buildDefaultExpandedStates = useCallback(() => {
    const states: Record<string, boolean> = {};
    items.forEach((item) => {
      states[item.id] = item.defaultExpanded ?? true;
    });
    return states;
  }, [items]);

  const defaultOrder = useMemo(() => itemIds, [itemIds]);
  const initialData = useMemo(() => {
    if (!persistState) {
      return {
        order: defaultOrder,
        expandedStates: buildDefaultExpandedStates(),
      };
    }
    return loadTrnSortableSettingsCardData(panelId, defaultOrder, items);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable itemIdsString gate
  }, [panelId, itemIdsString, persistState]);

  const [order, setOrder] = useState<string[]>(initialData.order);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(
    initialData.expandedStates,
  );

  const previousItemIdsRef = useRef<string>(itemIdsString);

  const persist = useCallback(
    (nextOrder: string[], nextExpanded: Record<string, boolean>) => {
      if (persistState) {
        saveTrnSortableSettingsCardData(panelId, {
          order: nextOrder,
          expandedStates: nextExpanded,
        });
      }
    },
    [panelId, persistState],
  );

  const handleCardToggle = useCallback(
    (cardId: string, expanded: boolean) => {
      setExpandedStates((prev) => {
        const newStates = { ...prev, [cardId]: expanded };
        persist(order, newStates);
        return newStates;
      });
    },
    [order, persist],
  );

  useEffect(() => {
    if (previousItemIdsRef.current === itemIdsString) {
      return;
    }

    const previousIds = new Set(
      previousItemIdsRef.current.split(",").filter(Boolean),
    );
    const currentIds = new Set(items.map((item) => item.id));
    const itemIdArray = items.map((item) => item.id);

    const hasNewItems = itemIdArray.some((id) => !previousIds.has(id));
    const hasRemovedItems = Array.from(previousIds).some(
      (id) => !currentIds.has(id),
    );

    if (hasNewItems || hasRemovedItems) {
      const existingOrder = order.filter((id) => currentIds.has(id));
      const newItemIds = itemIdArray.filter((id) => !previousIds.has(id));
      const newOrder = [...existingOrder, ...newItemIds];

      const newExpandedStates = { ...expandedStates };
      newItemIds.forEach((id) => {
        const item = items.find((entry) => entry.id === id);
        if (item && !(id in newExpandedStates)) {
          newExpandedStates[id] = item.defaultExpanded ?? true;
        }
      });
      Object.keys(newExpandedStates).forEach((id) => {
        if (!currentIds.has(id)) {
          delete newExpandedStates[id];
        }
      });

      if (JSON.stringify(newOrder) !== JSON.stringify(order)) {
        setOrder(newOrder);
        setExpandedStates(newExpandedStates);
        persist(newOrder, newExpandedStates);
      }
    }

    previousItemIdsRef.current = itemIdsString;
  }, [itemIdsString, items, order, expandedStates, persist]);

  const sortedItems = order
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is TRNSortableSettingsCardItem => item != null);

  const newItems = items.filter((item) => !order.includes(item.id));
  const finalItems = [...sortedItems, ...newItems];
  const sortableItemIds = finalItems.map((item) => item.id);

  const handleReorder = useCallback(
    (nextItemIds: string[]) => {
      setOrder(nextItemIds);
      persist(nextItemIds, expandedStates);
    },
    [expandedStates, persist],
  );

  return (
    <TRNSortableContainer
      itemIds={sortableItemIds}
      onReorder={handleReorder}
      className={className ?? "space-y-2"}
    >
      {finalItems.map((item) => (
        <TRNSortableCard
          key={item.id}
          id={item.id}
          title={item.title}
          icon={item.icon}
          expanded={expandedStates[item.id] ?? item.defaultExpanded ?? true}
          onExpandedChange={(expanded) => handleCardToggle(item.id, expanded)}
          glass
          glassPreset="soft"
        >
          {item.content}
        </TRNSortableCard>
      ))}
    </TRNSortableContainer>
  );
}
