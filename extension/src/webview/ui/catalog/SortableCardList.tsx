import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LucideIcon } from 'lucide-react';
import { CollapsibleCard } from './InspectorCollapsibleCard.js';

import type { ParameterBadge } from './InspectorCollapsibleCard.js';

export type SortableCardItem = {
  id: string;
  title: string;
  icon: LucideIcon;
  content: React.ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  badge?: ParameterBadge;
};

export interface SortableCardListProps {
  items: SortableCardItem[];
  panelId: string;
  className?: string;
  persistState?: boolean;
}

const STORAGE_PREFIX = 't3d-card-order-';

type CardStorageData = {
  order: string[];
  expandedStates: Record<string, boolean>;
};

function getStorageKey(panelId: string): string {
  return `${STORAGE_PREFIX}${panelId}`;
}

function loadCardDataFromStorage(
  panelId: string,
  defaultOrder: string[],
  items: SortableCardItem[]
): CardStorageData {
  if (typeof window === 'undefined') {
    // Return default data structure
    const defaultExpandedStates: Record<string, boolean> = {};
    items.forEach((item) => {
      defaultExpandedStates[item.id] = item.defaultExpanded ?? true;
    });
    return {
      order: defaultOrder,
      expandedStates: defaultExpandedStates,
    };
  }

  try {
    const key = getStorageKey(panelId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Backward compatibility: handle old string[] format
      if (Array.isArray(parsed)) {
        // Migrate old format to new format
        const savedOrder = parsed.filter((id: string) =>
          defaultOrder.includes(id)
        );
        const newItems = defaultOrder.filter(
          (id: string) => !parsed.includes(id)
        );
        const migratedOrder = [...savedOrder, ...newItems];

        // Initialize expandedStates from defaultExpanded
        const migratedExpandedStates: Record<string, boolean> = {};
        items.forEach((item) => {
          migratedExpandedStates[item.id] = item.defaultExpanded ?? true;
        });

        const migratedData: CardStorageData = {
          order: migratedOrder,
          expandedStates: migratedExpandedStates,
        };

        // Save migrated format back to localStorage
        saveCardDataToStorage(panelId, migratedData);

        console.log(
          `[SortableCardList] Migrated old format for ${panelId} to new format`
        );
        return migratedData;
      }

      // New format: object with order and expandedStates
      if (
        parsed &&
        typeof parsed === 'object' &&
        'order' in parsed &&
        'expandedStates' in parsed
      ) {
        const data = parsed as CardStorageData;

        // Preserve the saved order, but filter out items that no longer exist
        // and add any new items that weren't in the saved order
        const savedOrder = data.order.filter((id) => defaultOrder.includes(id));
        const newItems = defaultOrder.filter((id) => !data.order.includes(id));
        const resultOrder = [...savedOrder, ...newItems];

        // Merge expandedStates: keep saved states for existing items, use defaultExpanded for new items
        const resultExpandedStates: Record<string, boolean> = {
          ...data.expandedStates,
        };
        items.forEach((item) => {
          if (!(item.id in resultExpandedStates)) {
            resultExpandedStates[item.id] = item.defaultExpanded ?? true;
          }
        });

        // Remove expandedStates for items that no longer exist
        Object.keys(resultExpandedStates).forEach((id) => {
          if (!defaultOrder.includes(id)) {
            delete resultExpandedStates[id];
          }
        });

        const result: CardStorageData = {
          order: resultOrder,
          expandedStates: resultExpandedStates,
        };

        console.log(`[SortableCardList] Loaded data for ${panelId}:`, result);
        return result;
      }
    } else {
      console.log(
        `[SortableCardList] No saved data for ${panelId}, using defaults`
      );
    }
  } catch (error) {
    console.warn('Failed to load card data from localStorage:', error);
  }

  // Return default data structure
  const defaultExpandedStates: Record<string, boolean> = {};
  items.forEach((item) => {
    defaultExpandedStates[item.id] = item.defaultExpanded ?? true;
  });
  return {
    order: defaultOrder,
    expandedStates: defaultExpandedStates,
  };
}

function saveCardDataToStorage(panelId: string, data: CardStorageData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getStorageKey(panelId);
    const value = JSON.stringify(data);
    localStorage.setItem(key, value);
    console.log(`[SortableCardList] Saved data for ${panelId}:`, data);
  } catch (error) {
    // Handle quota exceeded or other errors gracefully
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, cannot save card data');
    } else {
      console.warn('Failed to save card data to localStorage:', error);
    }
  }
}

function SortableCardItem({
  item,
  isDragging,
  isExpanded,
  onToggle,
}: {
  item: SortableCardItem;
  isDragging: boolean;
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CollapsibleCard
        title={item.title}
        icon={item.icon}
        isExpanded={isExpanded}
        onToggle={onToggle}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging || isSortableDragging}
        badge={item.badge}
      >
        {item.content}
      </CollapsibleCard>
    </div>
  );
}

export function SortableCardList({
  items,
  panelId,
  className,
  persistState = true,
}: SortableCardListProps) {
  // Get item IDs as a stable array for comparison
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemIdsString = useMemo(
    () => itemIds.slice().sort().join(','),
    [itemIds]
  );

  const buildDefaultExpandedStates = useCallback(() => {
    const states: Record<string, boolean> = {};
    items.forEach((item) => {
      states[item.id] = item.defaultExpanded ?? true;
    });
    return states;
  }, [items]);

  // Load card data (order and expandedStates) from localStorage only once per panelId
  // Use useMemo with itemIdsString (stable) as dependency, not items array
  const defaultOrder = useMemo(() => itemIds, [itemIds]);
  const initialData = useMemo(
    () => {
      if (!persistState) {
        return {
          order: defaultOrder,
          expandedStates: buildDefaultExpandedStates(),
        };
      }
      // Only load if panelId or item IDs changed (not when items array reference changes)
      return loadCardDataFromStorage(panelId, defaultOrder, items);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panelId, itemIdsString, persistState] // Depend on stable itemIdsString, not items array (items/buildDefaultExpandedStates accessed but intentionally not in deps)
  );

  const [order, setOrder] = useState<string[]>(initialData.order);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(
    initialData.expandedStates
  );

  // Track the previous item IDs to detect when items actually change
  const previousItemIdsRef = useRef<string>(itemIdsString);

  // Handle card toggle: update expanded state and save to localStorage
  const handleCardToggle = useCallback(
    (cardId: string, expanded: boolean) => {
      setExpandedStates((prev) => {
        const newStates = { ...prev, [cardId]: expanded };
        if (persistState) {
          // Save to localStorage
          saveCardDataToStorage(panelId, {
            order,
            expandedStates: newStates,
          });
        }
        return newStates;
      });
    },
    [panelId, order, persistState]
  );

  // Only update order when items are added or removed (not on every render)
  useEffect(() => {
    // Skip if item IDs haven't actually changed
    if (previousItemIdsRef.current === itemIdsString) {
      return;
    }

    const previousIds = new Set(
      previousItemIdsRef.current.split(',').filter(Boolean)
    );
    const currentIds = new Set(items.map((item) => item.id));
    const itemIdArray = items.map((item) => item.id);

    // Check if items have changed (new items added or removed)
    const hasNewItems = itemIdArray.some((id) => !previousIds.has(id));
    const hasRemovedItems = Array.from(previousIds).some(
      (id) => !currentIds.has(id)
    );

    // Only update if there are actual changes to items
    if (hasNewItems || hasRemovedItems) {
      // Merge: keep existing order for items that still exist, append new items at the end
      const existingOrder = order.filter((id) => currentIds.has(id));
      const newItemIds = itemIdArray.filter((id) => !previousIds.has(id));
      const newOrder = [...existingOrder, ...newItemIds];

      // Update expandedStates: keep existing states, add defaults for new items, remove deleted items
      const newExpandedStates = { ...expandedStates };
      newItemIds.forEach((id) => {
        const item = items.find((item) => item.id === id);
        if (item && !(id in newExpandedStates)) {
          newExpandedStates[id] = item.defaultExpanded ?? true;
        }
      });
      // Remove states for deleted items
      Object.keys(newExpandedStates).forEach((id) => {
        if (!currentIds.has(id)) {
          delete newExpandedStates[id];
        }
      });

      // Only update if the order actually changed
      if (JSON.stringify(newOrder) !== JSON.stringify(order)) {
        setOrder(newOrder);
        setExpandedStates(newExpandedStates);
        if (persistState) {
          console.log(
            `[SortableCardList] Items changed for ${panelId}, updating data`
          );
          // Save the merged data to localStorage
          saveCardDataToStorage(panelId, {
            order: newOrder,
            expandedStates: newExpandedStates,
          });
        }
      }
    }

    previousItemIdsRef.current = itemIdsString;
  }, [itemIdsString, panelId, persistState, items, order, expandedStates]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCardWidth, setActiveCardWidth] = useState<number | null>(null);
  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Find the card element and capture its width
    // The element with data-sortable-id contains the card
    const cardContainer = document.querySelector(
      `[data-sortable-id="${event.active.id}"]`
    ) as HTMLElement;
    if (cardContainer) {
      // Get the actual card width (the first child div contains the card)
      const cardElement = cardContainer.firstElementChild as HTMLElement;
      if (cardElement) {
        setActiveCardWidth(cardElement.offsetWidth);
      } else {
        // Fallback to container width
        setActiveCardWidth(cardContainer.offsetWidth);
      }
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveCardWidth(null);

      if (over && active.id !== over.id) {
        setOrder((currentOrder) => {
          const oldIndex = currentOrder.indexOf(active.id as string);
          const newIndex = currentOrder.indexOf(over.id as string);

          if (oldIndex === -1 || newIndex === -1) {
            console.warn('[SortableCardList] Invalid drag indices:', {
              oldIndex,
              newIndex,
              currentOrder,
            });
            return currentOrder;
          }

          const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
          if (persistState) {
            console.log(
              `[SortableCardList] Drag ended for ${panelId}, saving new order:`,
              newOrder
            );
            // Save both order and expandedStates
            saveCardDataToStorage(panelId, {
              order: newOrder,
              expandedStates,
            });
          }
          return newOrder;
        });
      }
    },
    [panelId, expandedStates, persistState]
  );

  // Sort items according to saved order
  const sortedItems = order
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is SortableCardItem => item !== undefined);

  // Add any new items that aren't in the order yet
  const newItems = items.filter((item) => !order.includes(item.id));
  const finalItems = [...sortedItems, ...newItems];

  // The items array for SortableContext must match the order of rendered items
  const sortableItems = finalItems.map((item) => item.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableItems}
        strategy={verticalListSortingStrategy}
      >
        <div className={className || 'space-y-2'}>
          {finalItems.map((item) => (
            <div key={item.id} data-sortable-id={item.id}>
              <SortableCardItem
                item={item}
                isDragging={activeId === item.id}
                isExpanded={
                  expandedStates[item.id] ?? item.defaultExpanded ?? true
                }
                onToggle={(expanded) => handleCardToggle(item.id, expanded)}
              />
            </div>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem && activeCardWidth ? (
          <div
            style={{
              width: `${activeCardWidth}px`,
              opacity: 0.9,
              transform: 'rotate(2deg)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            }}
          >
            <CollapsibleCard
              title={activeItem.title}
              icon={activeItem.icon}
              isExpanded={
                expandedStates[activeItem.id] ??
                activeItem.defaultExpanded ??
                true
              }
              onToggle={(expanded) => handleCardToggle(activeItem.id, expanded)}
              dragHandleProps={{}}
              isDragging={true}
              badge={activeItem.badge}
            >
              {activeItem.content}
            </CollapsibleCard>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
