import { BookOpen, Boxes, ChevronDown, ChevronRight, LayoutGrid, Search, Sparkles, Waves, X, Box } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NodeCatalogEntry, NodePaletteLayoutMode } from "../../../core/config/config-types";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { resolveSingleModelSelectParentId, readGlbExtractTag, readSourceModelNodeId } from "../model/model-generated-bindings";
import { studioGlbExtractRowKey } from "../gltf/studio-gltf-extract";
import { useStudioGltfExtraction } from "../gltf/useStudioGltfExtraction";
import { GlbExtractionTabPanel } from "./node-palette/GlbExtractionTabPanel";
import { GroupLibraryTabPanel } from "./node-palette/GroupLibraryTabPanel";
import { filterPaletteEntries } from "./node-palette/filter-palette-entries";
import { LibraryEntryRow } from "./node-palette/LibraryEntryRow";
import {
  getPaletteEntryMeta,
  getSubgroupChip,
  getSubgroupLabel,
  isPaletteSensorFamilySubgroup,
  isPaletteSensorPrimaryEntry,
  isPaletteSensorTapEntry,
  PALETTE_SENSOR_FAMILY_SUBGROUPS,
  PALETTE_SENSOR_SUBGROUP_ORDER,
  resolvePaletteRowVariant,
  splitSensorFamilyPanelEntries,
  type PaletteSensorFamilySubgroup,
  type PaletteSensorSubgroup,
} from "./node-palette/palette-entry-meta";
import { PaletteDensityProvider, usePaletteDensity } from "./node-palette/palette-density-context";
import { PaletteLiveTickProvider } from "./node-palette/PaletteLiveTickContext";
import {
  PaletteSensorTreeLayoutProvider,
} from "./node-palette/palette-sensor-tree-layout-context";
import {
  type SensorFamilyTreeGutterRole,
} from "./node-palette/sensor-family-tree-layout";
import {
  readStoredPaletteCollapsedSubgroups,
  writeStoredPaletteCollapsedSubgroups,
  type NodePaletteDensity,
  type SensorFamilyTreeLayout,
} from "./node-palette/node-palette-ui-persistence";
import { NODE_PALETTE_FONT_CLASS } from "./node-palette/node-palette-font";
import { NodePaletteClassic } from "./node-palette/NodePaletteClassic";
import { NodePaletteSectioned } from "./node-palette/NodePaletteSectioned";
import { NodePaletteTwoLine } from "./node-palette/NodePaletteTwoLine";
import { NodePaletteAccordion } from "./node-palette/NodePaletteAccordion";

type NodePaletteTabId = "nodes" | "simulation" | "glb" | "groups";

type CategoryFilter = "all" | NodeCatalogEntry["category"];

type SensorFamilyFilter = "all" | PaletteSensorFamilySubgroup;

const CATEGORY_ORDER: NodeCatalogEntry["category"][] = [
  "sensor",
  "input",
  "transform",
  "logic",
  "output",
  "utility",
  "generator",
];

const CATEGORY_LABEL: Record<NodeCatalogEntry["category"], string> = {
  sensor: "Sensors",
  input: "Input",
  transform: "Transform",
  logic: "Logic",
  output: "Output",
  utility: "Utility",
  generator: "Generator",
};

function sortSensorGroupEntries(entries: NodeCatalogEntry[]): NodeCatalogEntry[] {
  const primary: NodeCatalogEntry[] = [];
  const taps: NodeCatalogEntry[] = [];
  const rest: NodeCatalogEntry[] = [];
  for (const entry of entries) {
    if (isPaletteSensorPrimaryEntry(entry)) {
      primary.push(entry);
    } else if (isPaletteSensorTapEntry(entry)) {
      taps.push(entry);
    } else {
      rest.push(entry);
    }
  }
  return [...primary, ...taps, ...rest];
}

function isGroupedHardwareFamily(subgroup: PaletteSensorSubgroup): boolean {
  return isPaletteSensorFamilySubgroup(subgroup);
}

type NodePaletteProps = {
  borderColor: string;
  panelColor: string;
  entries: NodeCatalogEntry[];
  onAddNode: (entry: NodeCatalogEntry) => void;
  defaultPaletteLayout?: NodePaletteLayoutMode;
  /** Spawn a number-constant linked to the Model, tagged with GLB extraction metadata. */
  onSpawnGlbExtract?: (args: {
    parentModelFlowNodeId: string;
    row: import("../gltf/studio-gltf-extract").StudioGltfExtractRow;
  }) => void;
  /** Spawn **Toggle GLB Part** for a part row (Library GLB tab). */
  onSpawnGlbEventPartExtract?: (args: {
    parentModelFlowNodeId: string;
    row: import("../gltf/studio-gltf-extract").StudioGltfExtractRow;
  }) => void;
  /** Spawn **Trigger GLB Anim** for an animation row (Library GLB tab). */
  onSpawnGlbEventAnimExtract?: (args: {
    parentModelFlowNodeId: string;
    row: import("../gltf/studio-gltf-extract").StudioGltfExtractRow;
  }) => void;
  /** Spawn **GLB Material Texture** for a material row (Library GLB tab). */
  onSpawnGlbMaterialTextureExtract?: (args: {
    parentModelFlowNodeId: string;
    row: import("../gltf/studio-gltf-extract").StudioGltfExtractRow;
  }) => void;
  /** Spawn **GLB Material Color** for a material row (Library GLB tab). */
  onSpawnGlbMaterialColorExtract?: (args: {
    parentModelFlowNodeId: string;
    row: import("../gltf/studio-gltf-extract").StudioGltfExtractRow;
  }) => void;
  /** When set, section headers, filter chips, and rows pick up the same hues as the flow minimap. */
  categoryColors?: Record<NodeCatalogEntry["category"], string>;
  /** Secondary text from the workbench theme (helper / meta lines). */
  mutedTextColor?: string;
};


export function NodePalette(props: NodePaletteProps) {
  const {
    borderColor,
    panelColor,
    entries,
    onAddNode,
    defaultPaletteLayout = "sectioned",
    onSpawnGlbExtract,
    onSpawnGlbEventPartExtract,
    onSpawnGlbEventAnimExtract,
    onSpawnGlbMaterialTextureExtract,
    onSpawnGlbMaterialColorExtract,
    categoryColors,
    mutedTextColor,
  } = props;
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<NodePaletteTabId>("nodes");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sensorFamilyFilter, setSensorFamilyFilter] = useState<SensorFamilyFilter>("all");
  // Locked modes (for now): keep the palette in Dense + Compact tree + Sectioned layout.
  const density: NodePaletteDensity = "dense";
  const [collapsedSubgroups, setCollapsedSubgroups] = useState<Set<PaletteSensorSubgroup>>(
    () => readStoredPaletteCollapsedSubgroups(),
  );
  const sensorTreeLayout: SensorFamilyTreeLayout = "compact";
  const paletteLayout: NodePaletteLayoutMode = "sectioned";

  const nodeGroupLibrary = useFlowEditorStore((s) => s.nodeGroupLibrary);
  const parentModelFlowNodeId = useFlowEditorStore((s) => resolveSingleModelSelectParentId(s));
  const modelNodes = useFlowEditorStore((s) => s.nodes);
  const glbFetchUrl = useMemo(() => {
    if (parentModelFlowNodeId == null) {
      return null;
    }
    const n = modelNodes.find((x) => x.id === parentModelFlowNodeId);
    if (n?.data.nodeId !== "model-select") {
      return null;
    }
    const u = n.data.defaultConfig["selectedModelUrl"];
    return typeof u === "string" && u.trim().length > 0 ? u.trim() : null;
  }, [parentModelFlowNodeId, modelNodes]);

  const filteredGroupLibraryCount = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return nodeGroupLibrary.length;
    }
    return nodeGroupLibrary.filter((asset) =>
      [asset.meta.name, asset.meta.description ?? "", ...(asset.meta.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    ).length;
  }, [nodeGroupLibrary, query]);

  const glbExtraction = useStudioGltfExtraction(tab === "glb" ? glbFetchUrl : null);

  const glbRows = useMemo(
    () =>
      glbExtraction.result ?? {
        animations: [],
        parts: [],
        materials: [],
        morphs: [],
        lights: [],
        cameras: [],
      },
    [glbExtraction.result],
  );

  const glbPlacedRowKeys = useMemo(() => {
    if (parentModelFlowNodeId == null) {
      return new Set<string>();
    }
    const set = new Set<string>();
    for (const n of modelNodes) {
      const pid = readSourceModelNodeId(n.data.defaultConfig);
      if (pid !== parentModelFlowNodeId) {
        continue;
      }
      const tag = readGlbExtractTag(n.data.defaultConfig);
      if (tag == null) {
        continue;
      }
      set.add(studioGlbExtractRowKey(tag));
    }
    return set;
  }, [modelNodes, parentModelFlowNodeId]);

  const secondaryTextColor = mutedTextColor ?? "#a1a1aa";

  const dense = density === "dense";

  const entryAccent = (entry: NodeCatalogEntry) => categoryColors?.[entry.category];

  const paletteFilterActive =
    query.trim().length > 0 ||
    (tab === "nodes" && (categoryFilter !== "all" || sensorFamilyFilter !== "all"));

  const showFilterSecondary =
    query.trim().length > 0 ||
    (tab === "nodes" && (categoryFilter !== "all" || sensorFamilyFilter !== "all"));

  const resetPaletteFilters = useCallback(() => {
    setQuery("");
    setCategoryFilter("all");
    setSensorFamilyFilter("all");
  }, []);

  const toggleSubgroupCollapsed = useCallback((subgroup: PaletteSensorSubgroup) => {
    setCollapsedSubgroups((prev) => {
      const next = new Set(prev);
      if (next.has(subgroup)) {
        next.delete(subgroup);
      } else {
        next.add(subgroup);
      }
      writeStoredPaletteCollapsedSubgroups(next);
      return next;
    });
  }, []);

  const sensorSubgroupDot = categoryColors?.sensor ?? "#52525b";

  const standardNodes = useMemo(() => {
    const q = query.trim();
    const pruned = entries.filter((entry) => {
      if (entry.id === "sensor-input" || entry.id === "sine-wave") {
        return false;
      }
      if (q.length === 0) {
        return entry.defaultVisible === true;
      }
      return true;
    });
    return filterPaletteEntries(pruned, q);
  }, [entries, query]);

  const simulationNodes = useMemo(() => {
    const q = query.trim();
    const pruned = entries.filter((entry) => entry.id === "sine-wave");
    return filterPaletteEntries(pruned, q);
  }, [entries, query]);

  const activeList = tab === "simulation" ? simulationNodes : standardNodes;

  const headerListCount =
    tab === "glb"
      ? glbExtraction.totalRows
      : tab === "groups"
        ? filteredGroupLibraryCount
        : activeList.length;

  const categoryCounts = useMemo(() => {
    const m = new Map<NodeCatalogEntry["category"], number>();
    for (const e of standardNodes) {
      m.set(e.category, (m.get(e.category) ?? 0) + 1);
    }
    return m;
  }, [standardNodes]);

  const sensorFamilyCounts = useMemo(() => {
    const counts = new Map<PaletteSensorFamilySubgroup, number>();
    for (const sg of PALETTE_SENSOR_FAMILY_SUBGROUPS) {
      counts.set(sg, 0);
    }
    for (const entry of standardNodes) {
      if (entry.category !== "sensor") {
        continue;
      }
      const meta = getPaletteEntryMeta(entry);
      const sg = meta.sensorSubgroup;
      if (sg != null && isPaletteSensorFamilySubgroup(sg)) {
        counts.set(sg, (counts.get(sg) ?? 0) + 1);
      }
    }
    return counts;
  }, [standardNodes]);

  const sensorListGrouped = query.trim().length === 0;

  const groupedByCategory = useMemo(() => {
    const m = new Map<NodeCatalogEntry["category"], NodeCatalogEntry[]>();
    for (const c of CATEGORY_ORDER) {
      m.set(c, []);
    }
    for (const e of activeList) {
      m.get(e.category)?.push(e);
    }
    return m;
  }, [activeList]);

  const sensorNodes = groupedByCategory.get("sensor") ?? [];
  const sensorBySubgroup = useMemo(() => {
    const map = new Map<PaletteSensorSubgroup, NodeCatalogEntry[]>();
    for (const sg of PALETTE_SENSOR_SUBGROUP_ORDER) {
      map.set(sg, []);
    }
    for (const entry of sensorNodes) {
      const meta = getPaletteEntryMeta(entry);
      const sg = meta.sensorSubgroup;
      if (sg != null) {
        map.get(sg)?.push(entry);
      }
    }
    return map;
  }, [sensorNodes]);

  const renderSensorFamilyTreeRows = (
    list: NodeCatalogEntry[],
    layout: SensorFamilyTreeLayout,
  ) => {
    const { primary, children } = splitSensorFamilyPanelEntries(list);
    const rows: Array<{
      entry: NodeCatalogEntry;
      treeRole: SensorFamilyTreeGutterRole | null;
    }> = [];

    if (layout === "header-root") {
      for (let i = 0; i < children.length; i += 1) {
        rows.push({
          entry: children[i],
          treeRole: i === children.length - 1 ? "tap-last" : "tap-middle",
        });
      }
      return rows.map(({ entry, treeRole }) => {
        const meta = getPaletteEntryMeta(entry);
        return (
          <LibraryEntryRow
            key={entry.id}
            entry={entry}
            borderColor={borderColor}
            onAddNode={onAddNode}
            chip={meta.chip}
            categoryAccent={entryAccent(entry)}
            grouped
            hideChip
            variant={resolvePaletteRowVariant(entry, true)}
            treeRole={treeRole}
          />
        );
      });
    }

    if (primary != null) {
      rows.push({ entry: primary, treeRole: "root" });
    }
    for (let i = 0; i < children.length; i += 1) {
      rows.push({
        entry: children[i],
        treeRole: i === children.length - 1 ? "tap-last" : "tap-middle",
      });
    }

    return rows.map(({ entry, treeRole }) => {
      const meta = getPaletteEntryMeta(entry);
      return (
        <LibraryEntryRow
          key={entry.id}
          entry={entry}
          borderColor={borderColor}
          onAddNode={onAddNode}
          chip={meta.chip}
          categoryAccent={entryAccent(entry)}
          grouped
          hideChip
          variant={resolvePaletteRowVariant(entry, true)}
          treeRole={treeRole}
        />
      );
    });
  };

  const renderSensorEntryList = (
    list: NodeCatalogEntry[],
    options: { grouped: boolean; hideChip: boolean; treeLayout?: SensorFamilyTreeLayout },
  ) => {
    if (options.grouped && options.treeLayout != null) {
      return renderSensorFamilyTreeRows(list, options.treeLayout);
    }
    return sortSensorGroupEntries(list).map((entry) => {
      const meta = getPaletteEntryMeta(entry);
      return (
        <LibraryEntryRow
          key={entry.id}
          entry={entry}
          borderColor={borderColor}
          onAddNode={onAddNode}
          chip={meta.chip}
          categoryAccent={entryAccent(entry)}
          grouped={options.grouped}
          hideChip={options.hideChip}
          variant={resolvePaletteRowVariant(entry, options.grouped)}
        />
      );
    });
  };

  const renderSensorSections = () => {
    const subgroupsToRender = PALETTE_SENSOR_SUBGROUP_ORDER.filter((sg) => {
      if (
        categoryFilter === "sensor" &&
        sensorFamilyFilter !== "all" &&
        sg !== sensorFamilyFilter
      ) {
        return false;
      }
      return (sensorBySubgroup.get(sg)?.length ?? 0) > 0;
    });

    return (
      <>
        {subgroupsToRender.map((sg) => {
          const list = sensorBySubgroup.get(sg) ?? [];
          if (list.length === 0) {
            return null;
          }

          const collapsed = collapsedSubgroups.has(sg);
          const groupedPanel = sensorListGrouped && isGroupedHardwareFamily(sg);

          if (groupedPanel) {
            const { primary, children } = splitSensorFamilyPanelEntries(list);
            const isHeaderRoot = sensorTreeLayout === "header-root";

            if (isHeaderRoot) {
              return (
                <div
                  key={sg}
                  className="overflow-hidden rounded-lg border border-zinc-700/70 bg-zinc-950/20"
                  style={{ borderColor }}
                >
                  <div className="flex items-stretch border-b border-zinc-800/70">
                    <button
                      type="button"
                      className={`flex shrink-0 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-800/30 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500/35 ${
                        dense ? "w-7" : "w-8"
                      }`}
                      aria-expanded={!collapsed}
                      aria-label={`${collapsed ? "Expand" : "Collapse"} ${getSubgroupLabel(sg)}`}
                      onClick={() => toggleSubgroupCollapsed(sg)}
                    >
                      {collapsed ? (
                        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                      ) : (
                        <ChevronDown className="size-3.5 shrink-0" aria-hidden />
                      )}
                    </button>
                    {primary != null ? (
                      <div className="min-w-0 flex-1">
                        <LibraryEntryRow
                          entry={primary}
                          borderColor={borderColor}
                          onAddNode={onAddNode}
                          chip={getPaletteEntryMeta(primary).chip}
                          categoryAccent={entryAccent(primary)}
                          grouped
                          hideChip
                          variant="primary"
                          treeRole="header-root"
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex min-w-0 flex-1 items-center gap-1.5 px-2 font-semibold uppercase tracking-wider text-zinc-400 ${
                          dense ? "py-1.5 text-[9px]" : "py-2 text-[10px]"
                        }`}
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full ring-1 ring-white/10"
                          style={{ backgroundColor: sensorSubgroupDot }}
                          aria-hidden
                        />
                        {getSubgroupLabel(sg)}
                      </div>
                    )}
                  </div>
                  {!collapsed && children.length > 0 ? (
                    <div className={`relative ${dense ? "py-0.5" : "pb-1.5 pt-1.5"}`}>
                      {renderSensorFamilyTreeRows(list, sensorTreeLayout)}
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <div
                key={sg}
                className="overflow-hidden rounded-lg border border-zinc-700/70 bg-zinc-950/20"
                style={{ borderColor }}
              >
                <button
                  type="button"
                  className={`flex w-full select-none items-center gap-1.5 text-left font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:bg-zinc-800/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500/35 ${
                    dense ? "px-2 py-1.5 text-[9px]" : "px-2.5 py-2 text-[10px]"
                  }`}
                  aria-expanded={!collapsed}
                  onClick={() => toggleSubgroupCollapsed(sg)}
                >
                  {collapsed ? (
                    <ChevronRight className="size-3 shrink-0 text-zinc-500" aria-hidden />
                  ) : (
                    <ChevronDown className="size-3 shrink-0 text-zinc-500" aria-hidden />
                  )}
                  <span
                    className="size-1.5 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: sensorSubgroupDot }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{getSubgroupLabel(sg)}</span>
                  <span className="shrink-0 tabular-nums text-zinc-600">{list.length}</span>
                </button>
                {!collapsed ? (
                  <div className={`relative ${dense ? "py-0.5" : "pb-1.5 pt-1.5"}`}>
                    {renderSensorFamilyTreeRows(list, sensorTreeLayout)}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <div key={sg} className={dense ? "space-y-1" : "space-y-1.5"}>
              <button
                type="button"
                className={`flex w-full select-none items-center gap-1.5 border-b border-zinc-700/70 text-left font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                  dense ? "pb-0.5 text-[9px]" : "pb-1 text-[10px]"
                }`}
                style={{ borderColor }}
                aria-expanded={!collapsed}
                onClick={() => toggleSubgroupCollapsed(sg)}
              >
                {collapsed ? (
                  <ChevronRight className="size-3 shrink-0" aria-hidden />
                ) : (
                  <ChevronDown className="size-3 shrink-0" aria-hidden />
                )}
                <span
                  className="size-1.5 shrink-0 rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: sensorSubgroupDot }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{getSubgroupLabel(sg)}</span>
                <span className="shrink-0 tabular-nums opacity-70">{list.length}</span>
              </button>
              {!collapsed ? (
                <div className={dense ? "space-y-0.5" : "space-y-1"}>
                  {renderSensorEntryList(list, {
                    grouped: false,
                    hideChip: false,
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </>
    );
  };

  const renderCategoryBlock = (category: NodeCatalogEntry["category"]) => {
    const nodes = groupedByCategory.get(category) ?? [];
    if (nodes.length === 0) {
      return null;
    }
    if (category === "sensor") {
      if (sensorNodes.length === 0) {
        return null;
      }
      const stripe = categoryColors?.sensor;
      return (
        <section key="sensor" className={dense ? "space-y-1.5" : "space-y-2"}>
          <h3
            className={`sticky top-0 z-10 -mx-2 mb-1 border-b border-zinc-800/80 px-2 font-semibold uppercase tracking-wide text-zinc-200 ${
              dense ? "py-1.5 text-[10px]" : "py-2 text-[11px]"
            }`}
            style={{
              backgroundColor: panelColor,
              ...(stripe != null ? { boxShadow: `inset 3px 0 0 0 ${stripe}` } : {}),
            }}
          >
            Sensors
          </h3>
          {renderSensorSections()}
        </section>
      );
    }
    const stripe = categoryColors?.[category];
    return (
      <section key={category} className={dense ? "space-y-1.5" : "space-y-2"}>
        <h3
          className={`sticky top-0 z-10 -mx-2 mb-1 border-b border-zinc-800/80 px-2 font-semibold uppercase tracking-wide text-zinc-200 ${
            dense ? "py-1.5 text-[10px]" : "py-2 text-[11px]"
          }`}
          style={{
            backgroundColor: panelColor,
            ...(stripe != null ? { boxShadow: `inset 3px 0 0 0 ${stripe}` } : {}),
          }}
        >
          {CATEGORY_LABEL[category]}
        </h3>
        <div className={dense ? "space-y-0.5" : "space-y-1"}>
          {nodes.map((entry) => (
            <LibraryEntryRow
              key={entry.id}
              entry={entry}
              borderColor={borderColor}
              onAddNode={onAddNode}
              categoryAccent={entryAccent(entry)}
            />
          ))}
        </div>
      </section>
    );
  };

  const showCategoryRail = tab === "nodes";

  const renderLegacyPaletteLayout = (list: NodeCatalogEntry[]) => {
    const shared = {
      borderColor,
      secondaryTextColor,
      entries: list,
      onAddNode,
    };
    if (paletteLayout === "classic") {
      return <NodePaletteClassic {...shared} />;
    }
    if (paletteLayout === "two-line") {
      return <NodePaletteTwoLine {...shared} />;
    }
    if (paletteLayout === "accordion") {
      return <NodePaletteAccordion {...shared} />;
    }
    return <NodePaletteSectioned {...shared} />;
  };

  const useRichLibraryLayout = paletteLayout === "sectioned";

  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-lg ring-1 ring-zinc-800/80 ${NODE_PALETTE_FONT_CLASS}`}
      style={{
        borderColor,
        backgroundColor: panelColor,
      }}
    >
      <div
        className={`shrink-0 border-b border-zinc-800/90 px-3 ${dense ? "pb-1.5 pt-2" : "pb-2 pt-3"}`}
        style={{ borderColor }}
      >
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 ${dense ? "mb-2" : "mb-3"}`}>
          <h2 className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold tracking-tight text-zinc-100">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
            Library
          </h2>
          <div className="min-w-0 flex-1" aria-hidden />
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span
              className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400"
              title={
                tab === "glb"
                  ? paletteFilterActive
                    ? "GLB entries matching search"
                    : "Extracted GLB entries for the selected Model"
                  : tab === "groups"
                    ? paletteFilterActive
                      ? "Saved groups matching search"
                      : "Saved node group presets"
                  : paletteFilterActive
                    ? "Count of blocks matching the current list"
                    : "Blocks in this list"
              }
            >
              {headerListCount}
            </span>
            {showFilterSecondary ? (
              <span
                className="text-[9px] font-normal tabular-nums leading-none"
                style={mutedTextColor != null ? { color: mutedTextColor } : undefined}
              >
                Filtered
              </span>
            ) : null}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Library contents"
          className={`${dense ? "mb-2" : "mb-3"} flex rounded-lg bg-zinc-950/50 p-0.5 ring-1 ring-zinc-800/80`}
        >
          <button
            id="palette-tab-nodes"
            type="button"
            role="tab"
            aria-selected={tab === "nodes"}
            onClick={() => {
              setTab("nodes");
              setCategoryFilter("all");
              setSensorFamilyFilter("all");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
              dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
            } ${
              tab === "nodes" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <LayoutGrid className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
            Nodes
          </button>
          <button
            id="palette-tab-simulation"
            type="button"
            role="tab"
            aria-selected={tab === "simulation"}
            onClick={() => {
              setTab("simulation");
              setCategoryFilter("all");
              setSensorFamilyFilter("all");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
              dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
            } ${
              tab === "simulation" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
            Simulation
          </button>
          <button
            id="palette-tab-glb"
            type="button"
            role="tab"
            aria-selected={tab === "glb"}
            onClick={() => {
              setTab("glb");
              setCategoryFilter("all");
              setSensorFamilyFilter("all");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
              dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
            } ${
              tab === "glb" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Box className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
            GLB
          </button>
          <button
            id="palette-tab-groups"
            type="button"
            role="tab"
            aria-selected={tab === "groups"}
            onClick={() => {
              setTab("groups");
              setCategoryFilter("all");
              setSensorFamilyFilter("all");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
              dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
            } ${
              tab === "groups" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Boxes className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
            Groups
          </button>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            placeholder={
              tab === "glb"
                ? "Search clips, parts, materials, lights…"
                : tab === "groups"
                  ? "Search saved node groups…"
                  : "Search by name, sensor, or description…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setQuery("");
              }
            }}
            className={`w-full rounded-lg border border-zinc-700/80 bg-zinc-950/60 pl-8 outline-none placeholder:text-zinc-600 focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25 ${
              dense ? "py-1.5 text-[11px]" : "py-2 text-[12px]"
            } ${query.trim().length > 0 ? "pr-9" : "pr-2"}`}
            style={{ borderColor }}
            aria-label={
              tab === "glb"
                ? "Search GLB extraction list"
                : tab === "groups"
                  ? "Search saved node groups"
                  : "Search library"
            }
          />
          {query.trim().length > 0 ? (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X className="size-3.5 shrink-0" aria-hidden />
            </button>
          ) : null}
        </div>

        {showCategoryRail ? (
          <>
            <div
              className={`flex snap-x snap-mandatory gap-1 overflow-x-auto pb-0.5 scrollbar-hide ${dense ? "mt-2" : "mt-3"}`}
            >
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("all");
                  setSensorFamilyFilter("all");
                }}
                className={`snap-start shrink-0 rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                  dense ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
                } ${
                  categoryFilter === "all"
                    ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-100"
                    : "border-zinc-700/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                All
                <span className="ml-1 tabular-nums opacity-70">{standardNodes.length}</span>
              </button>
              {CATEGORY_ORDER.map((cat) => {
                const n = categoryCounts.get(cat) ?? 0;
                if (n === 0) {
                  return null;
                }
                const dot = categoryColors?.[cat] ?? "#52525b";
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat);
                      if (cat !== "sensor") {
                        setSensorFamilyFilter("all");
                      }
                    }}
                    className={`inline-flex snap-start shrink-0 items-center gap-1.5 rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                      dense ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
                    } ${
                      categoryFilter === cat
                        ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-100"
                        : "border-zinc-700/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    }`}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full ring-1 ring-white/10"
                      style={{ backgroundColor: dot }}
                      aria-hidden
                    />
                    {CATEGORY_LABEL[cat]}
                    <span className="ml-0.5 tabular-nums opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
            {categoryFilter === "sensor" ? (
              <div
                className={`flex snap-x snap-mandatory gap-1 overflow-x-auto pb-0.5 scrollbar-hide ${dense ? "mt-1.5" : "mt-2"}`}
                role="group"
                aria-label="Sensor family filter"
              >
                <button
                  type="button"
                  onClick={() => setSensorFamilyFilter("all")}
                  className={`snap-start shrink-0 rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                    dense ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
                  } ${
                    sensorFamilyFilter === "all"
                      ? "border-violet-500/45 bg-violet-950/35 text-violet-100"
                      : "border-zinc-700/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  All sensors
                  <span className="ml-1 tabular-nums opacity-70">
                    {categoryCounts.get("sensor") ?? 0}
                  </span>
                </button>
                {PALETTE_SENSOR_FAMILY_SUBGROUPS.map((sg) => {
                  const n = sensorFamilyCounts.get(sg) ?? 0;
                  if (n === 0) {
                    return null;
                  }
                  return (
                    <button
                      key={sg}
                      type="button"
                      onClick={() => setSensorFamilyFilter(sg)}
                      className={`snap-start shrink-0 rounded-full border font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                        dense ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
                      } ${
                        sensorFamilyFilter === sg
                          ? "border-violet-500/45 bg-violet-950/35 text-violet-100"
                          : "border-zinc-700/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      }`}
                    >
                      {getSubgroupChip(sg)}
                      <span className="ml-1 tabular-nums font-medium normal-case tracking-normal opacity-70">
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <PaletteLiveTickProvider>
        <PaletteDensityProvider value={density}>
          <PaletteSensorTreeLayoutProvider value={sensorTreeLayout}>
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 scrollbar-hide ${dense ? "pb-2 pt-0" : "pb-3 pt-0"}`}
            role="tabpanel"
            aria-labelledby={
              tab === "nodes"
                ? "palette-tab-nodes"
                : tab === "simulation"
                  ? "palette-tab-simulation"
                  : tab === "groups"
                    ? "palette-tab-groups"
                    : "palette-tab-glb"
            }
          >
          {tab === "glb" ? (
            <GlbExtractionTabPanel
              borderColor={borderColor}
              panelColor={panelColor}
              mutedTextColor={mutedTextColor}
              dense={dense}
              parentModelFlowNodeId={parentModelFlowNodeId}
              searchQuery={query}
              state={glbExtraction.state}
              totalRows={glbExtraction.totalRows}
              errorMessage={glbExtraction.errorMessage}
              rows={glbRows}
              placedRowKeys={glbPlacedRowKeys}
              onSpawnGlbExtract={onSpawnGlbExtract}
              onSpawnGlbEventPartExtract={onSpawnGlbEventPartExtract}
              onSpawnGlbEventAnimExtract={onSpawnGlbEventAnimExtract}
              onSpawnGlbMaterialTextureExtract={onSpawnGlbMaterialTextureExtract}
              onSpawnGlbMaterialColorExtract={onSpawnGlbMaterialColorExtract}
            />
          ) : tab === "groups" ? (
            <GroupLibraryTabPanel dense={dense} query={query} borderColor={borderColor} remoteEnabled />
          ) : activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Waves className="size-8 text-zinc-600" aria-hidden />
              <p className="max-w-56 text-[12px] text-zinc-500">No blocks match this search or filter.</p>
              <p
                className="text-[10px] text-zinc-600"
                style={mutedTextColor != null ? { color: mutedTextColor } : undefined}
              >
                Try another keyword or reset filters.
              </p>
              {paletteFilterActive ? (
                <button
                  type="button"
                  onClick={resetPaletteFilters}
                  className="rounded-lg border border-zinc-600/70 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition-colors hover:border-cyan-500/40 hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35"
                  style={{ borderColor }}
                >
                  Reset filters
                </button>
              ) : null}
            </div>
          ) : tab === "simulation" ? (
            <div className={dense ? "space-y-1 pt-2" : "space-y-2 pt-3"}>
              {useRichLibraryLayout ? (
                activeList.map((entry) => (
                  <LibraryEntryRow
                    key={entry.id}
                    entry={entry}
                    borderColor={borderColor}
                    onAddNode={onAddNode}
                    categoryAccent={entryAccent(entry)}
                  />
                ))
              ) : (
                renderLegacyPaletteLayout(activeList)
              )}
            </div>
          ) : !useRichLibraryLayout ? (
            <div className={dense ? "pt-2" : "pt-3"}>{renderLegacyPaletteLayout(activeList)}</div>
          ) : categoryFilter === "all" ? (
            <div className={dense ? "space-y-4 pt-2" : "space-y-6 pt-3"}>
              {CATEGORY_ORDER.map((c) => renderCategoryBlock(c))}
            </div>
          ) : categoryFilter === "sensor" ? (
            <div className={dense ? "space-y-1.5 pt-2" : "space-y-2 pt-3"}>{renderSensorSections()}</div>
          ) : (
            <div className={dense ? "space-y-0.5 pt-2" : "space-y-1 pt-3"}>
              {(groupedByCategory.get(categoryFilter) ?? []).map((entry) => (
                <LibraryEntryRow
                  key={entry.id}
                  entry={entry}
                  borderColor={borderColor}
                  onAddNode={onAddNode}
                  categoryAccent={entryAccent(entry)}
                />
              ))}
            </div>
          )}
        </div>
          </PaletteSensorTreeLayoutProvider>
        </PaletteDensityProvider>
      </PaletteLiveTickProvider>
    </section>
  );
}
