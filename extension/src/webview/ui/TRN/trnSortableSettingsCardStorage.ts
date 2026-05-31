/** Shared localStorage format for sortable inspector cards (catalog + TRN). */
export const TRN_SORTABLE_SETTINGS_CARD_STORAGE_PREFIX =
  "t3d-card-order-";

export type TRNSortableSettingsCardStorageData = {
  order: string[];
  expandedStates: Record<string, boolean>;
};

export type TRNSortableSettingsCardStorageItem = {
  id: string;
  defaultExpanded?: boolean;
};

export function getTrnSortableSettingsCardStorageKey(panelId: string): string {
  return `${TRN_SORTABLE_SETTINGS_CARD_STORAGE_PREFIX}${panelId}`;
}

export function loadTrnSortableSettingsCardData(
  panelId: string,
  defaultOrder: string[],
  items: TRNSortableSettingsCardStorageItem[],
): TRNSortableSettingsCardStorageData {
  if (typeof window === "undefined") {
    const defaultExpandedStates: Record<string, boolean> = {};
    items.forEach((item) => {
      defaultExpandedStates[item.id] = item.defaultExpanded ?? true;
    });
    return { order: defaultOrder, expandedStates: defaultExpandedStates };
  }

  try {
    const key = getTrnSortableSettingsCardStorageKey(panelId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;

      if (Array.isArray(parsed)) {
        const savedOrder = parsed.filter((id: string) =>
          defaultOrder.includes(id),
        );
        const newItems = defaultOrder.filter((id) => !parsed.includes(id));
        const migratedOrder = [...savedOrder, ...newItems];
        const migratedExpandedStates: Record<string, boolean> = {};
        items.forEach((item) => {
          migratedExpandedStates[item.id] = item.defaultExpanded ?? true;
        });
        const migratedData: TRNSortableSettingsCardStorageData = {
          order: migratedOrder,
          expandedStates: migratedExpandedStates,
        };
        saveTrnSortableSettingsCardData(panelId, migratedData);
        return migratedData;
      }

      if (
        parsed &&
        typeof parsed === "object" &&
        "order" in parsed &&
        "expandedStates" in parsed
      ) {
        const data = parsed as TRNSortableSettingsCardStorageData;
        const savedOrder = data.order.filter((id) => defaultOrder.includes(id));
        const newItems = defaultOrder.filter((id) => !data.order.includes(id));
        const resultOrder = [...savedOrder, ...newItems];
        const resultExpandedStates: Record<string, boolean> = {
          ...data.expandedStates,
        };
        items.forEach((item) => {
          if (!(item.id in resultExpandedStates)) {
            resultExpandedStates[item.id] = item.defaultExpanded ?? true;
          }
        });
        Object.keys(resultExpandedStates).forEach((id) => {
          if (!defaultOrder.includes(id)) {
            delete resultExpandedStates[id];
          }
        });
        return { order: resultOrder, expandedStates: resultExpandedStates };
      }
    }
  } catch (error) {
    console.warn("Failed to load sortable settings card data:", error);
  }

  const defaultExpandedStates: Record<string, boolean> = {};
  items.forEach((item) => {
    defaultExpandedStates[item.id] = item.defaultExpanded ?? true;
  });
  return { order: defaultOrder, expandedStates: defaultExpandedStates };
}

export function saveTrnSortableSettingsCardData(
  panelId: string,
  data: TRNSortableSettingsCardStorageData,
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const key = getTrnSortableSettingsCardStorageKey(panelId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, cannot save card data");
    } else {
      console.warn("Failed to save sortable settings card data:", error);
    }
  }
}
