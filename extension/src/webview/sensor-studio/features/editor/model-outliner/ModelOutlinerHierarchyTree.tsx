import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRNButton, TRNTooltip } from "../../../../ui/TRN";
import { ModelOutlinerSearchHighlight } from "./model-outliner-search-highlight";
import {
  studioGlbExtractRowKey,
  type StudioGltfExtractRow,
  type StudioGltfExtractionResult,
} from "../gltf/studio-gltf-extract";
import { setStudioGlbExtractDragData } from "../components/node-palette/glb-extract-drag";
import type { ModelOutlinerTypeFilter } from "./model-outliner-type-filter";
import {
  buildDefaultExpandedPaths,
  collectAllExpandablePaths,
  flattenVisibleHierarchy,
  parentScenePath,
  type ModelOutlinerFlatTreeRow,
} from "./model-outliner-hierarchy-nav";
import {
  modelOutlinerShowRowKindBadge,
  modelOutlinerTreeRowClass,
  resolveSceneTreeNodeIcon,
} from "./model-outliner-tree-chrome";

export type ModelOutlinerHierarchyTreeProps = {
  treeKey: string;
  searchQuery: string;
  typeFilter: ModelOutlinerTypeFilter;
  extraction: StudioGltfExtractionResult;
  parentModelFlowNodeId: string | null;
  inlineCatalogAssetId?: string | null;
  placedRowKeys: ReadonlySet<string>;
  selectedRowKey?: string | null;
  selectedScenePath?: string | null;
  canSpawn?: boolean;
  onRowSelect?: (row: StudioGltfExtractRow | null, scenePath: string) => void;
  onSpawn?: (row: StudioGltfExtractRow) => void;
};

type FlatTreeRowProps = {
  row: ModelOutlinerFlatTreeRow;
  searchQuery: string;
  typeFilter: ModelOutlinerTypeFilter;
  parentModelFlowNodeId: string | null;
  inlineCatalogAssetId: string | null;
  placedRowKeys: ReadonlySet<string>;
  selectedRowKey: string | null;
  selectedScenePath: string | null;
  focusPath: string | null;
  canSpawn: boolean;
  rowRef: (path: string, el: HTMLButtonElement | null) => void;
  onToggleExpand: (path: string) => void;
  onRowSelect?: (row: StudioGltfExtractRow | null, scenePath: string) => void;
  onSpawn?: (row: StudioGltfExtractRow) => void;
};

function FlatTreeRow(props: FlatTreeRowProps) {
  const {
    row,
    searchQuery,
    typeFilter,
    parentModelFlowNodeId,
    inlineCatalogAssetId,
    placedRowKeys,
    selectedRowKey,
    selectedScenePath,
    focusPath,
    canSpawn,
    rowRef,
    onToggleExpand,
    onRowSelect,
    onSpawn,
  } = props;

  const { node, path, extractRow, hasChildren, expanded, depth } = row;
  const placed = extractRow != null && placedRowKeys.has(studioGlbExtractRowKey(extractRow));
  const selected =
    selectedScenePath === path ||
    (extractRow != null && selectedRowKey === studioGlbExtractRowKey(extractRow));
  const keyboardFocused = focusPath === path;
  const canDrag =
    extractRow != null &&
    (parentModelFlowNodeId != null ||
      (inlineCatalogAssetId != null && inlineCatalogAssetId.trim().length > 0));
  const showKindBadge = modelOutlinerShowRowKindBadge(typeFilter);
  const NodeIcon = resolveSceneTreeNodeIcon(node);
  const showSpawnAction = canSpawn && extractRow != null && onSpawn != null;

  return (
    <div className="group/row min-w-0">
      <div className="flex min-w-0 items-stretch gap-0.5" style={{ paddingLeft: depth * 10 }}>
        {hasChildren ? (
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={() => onToggleExpand(path)}
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="size-5 shrink-0" aria-hidden />
        )}
        <button
          ref={(el) => rowRef(path, el)}
          type="button"
          draggable={canDrag}
          data-scene-path={path}
          className={
            modelOutlinerTreeRowClass(selected, placed) +
            (keyboardFocused && !selected ? " ring-1 ring-violet-500/40" : "")
          }
          onClick={() => {
            onRowSelect?.(extractRow, path);
          }}
          onDoubleClick={() => {
            if (extractRow != null) {
              onSpawn?.(extractRow);
            }
          }}
          onDragStart={(e) => {
            if (extractRow == null) {
              return;
            }
            if (parentModelFlowNodeId != null) {
              setStudioGlbExtractDragData(e.dataTransfer, {
                v: 1,
                parentModelFlowNodeId,
                kind: extractRow.kind,
                glbRef: extractRow.ref,
                label: extractRow.label,
              });
              return;
            }
            const inlineId = inlineCatalogAssetId.trim();
            if (inlineId.length === 0) {
              return;
            }
            setStudioGlbExtractDragData(e.dataTransfer, {
              v: 2,
              inlineCatalogAssetId: inlineId,
              kind: extractRow.kind,
              glbRef: extractRow.ref,
              label: extractRow.label,
            });
          }}
        >
          <NodeIcon className="size-3 shrink-0 text-zinc-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium">
            <ModelOutlinerSearchHighlight text={node.label} query={searchQuery} />
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {placed ? (
              <span
                className="size-1.5 rounded-full bg-emerald-400/90"
                aria-label="Placed on canvas"
              />
            ) : null}
            {showKindBadge && extractRow != null ? (
              <span className="text-[8px] uppercase tracking-wide text-cyan-400/75">
                {extractRow.kind}
              </span>
            ) : null}
            {showKindBadge && extractRow == null && node.nodeType !== "group" ? (
              <span className="text-[8px] uppercase tracking-wide text-zinc-600">{node.nodeType}</span>
            ) : null}
          </span>
        </button>
        {showSpawnAction ? (
          <TRNTooltip
            placement="left"
            openDelayMs={450}
            triggerWrapper="span"
            triggerAriaLabel={`Spawn linked node for ${node.label}`}
            content="Spawn linked flow node"
            trigger={
              <button
                type="button"
                className="flex size-5 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-800/70 hover:text-cyan-200 group-hover/row:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onSpawn?.(extractRow!);
                }}
              >
                <Plus className="size-3" aria-hidden />
              </button>
            }
          />
        ) : null}
      </div>
    </div>
  );
}

export function ModelOutlinerHierarchyTree(props: ModelOutlinerHierarchyTreeProps) {
  const {
    treeKey,
    searchQuery,
    typeFilter,
    extraction,
    parentModelFlowNodeId,
    inlineCatalogAssetId = null,
    placedRowKeys,
    selectedRowKey = null,
    selectedScenePath = null,
    canSpawn = false,
    onRowSelect,
    onSpawn,
  } = props;

  const treeRef = useRef<HTMLDivElement>(null);
  const rowButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    buildDefaultExpandedPaths(extraction.sceneTree, 2),
  );
  const [focusPath, setFocusPath] = useState<string | null>(null);

  useEffect(() => {
    setExpandedPaths(buildDefaultExpandedPaths(extraction.sceneTree, 2));
    setFocusPath(null);
  }, [treeKey, extraction.sceneTree]);

  useEffect(() => {
    if (selectedScenePath != null) {
      setFocusPath(selectedScenePath);
    }
  }, [selectedScenePath]);

  const flatRows = useMemo(
    () =>
      flattenVisibleHierarchy(
        extraction.sceneTree,
        expandedPaths,
        searchQuery,
        typeFilter,
        extraction,
      ),
    [expandedPaths, extraction, searchQuery, typeFilter],
  );

  const registerRowRef = useCallback((path: string, el: HTMLButtonElement | null) => {
    if (el == null) {
      rowButtonRefs.current.delete(path);
      return;
    }
    rowButtonRefs.current.set(path, el);
  }, []);

  const scrollRowIntoView = useCallback((path: string) => {
    rowButtonRefs.current.get(path)?.scrollIntoView({ block: "nearest" });
  }, []);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const activateRow = useCallback(
    (row: ModelOutlinerFlatTreeRow) => {
      setFocusPath(row.path);
      onRowSelect?.(row.extractRow, row.path);
      scrollRowIntoView(row.path);
    },
    [onRowSelect, scrollRowIntoView],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (flatRows.length === 0) {
        return;
      }
      const navigationKeys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter"];
      if (!navigationKeys.includes(event.key)) {
        return;
      }
      event.preventDefault();

      const currentPath = focusPath ?? selectedScenePath ?? flatRows[0]!.path;
      let index = flatRows.findIndex((row) => row.path === currentPath);
      if (index < 0) {
        index = 0;
      }

      if (event.key === "ArrowDown") {
        const next = flatRows[Math.min(flatRows.length - 1, index + 1)];
        if (next != null) {
          activateRow(next);
        }
        return;
      }
      if (event.key === "ArrowUp") {
        const next = flatRows[Math.max(0, index - 1)];
        if (next != null) {
          activateRow(next);
        }
        return;
      }

      const current = flatRows[index]!;
      if (event.key === "ArrowRight") {
        if (current.hasChildren && !expandedPaths.has(current.path)) {
          setExpandedPaths((prev) => new Set([...prev, current.path]));
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        if (current.hasChildren && expandedPaths.has(current.path)) {
          toggleExpand(current.path);
          return;
        }
        const parent = parentScenePath(current.path);
        if (parent != null) {
          setFocusPath(parent);
          scrollRowIntoView(parent);
        }
        return;
      }
      if (event.key === "Enter") {
        activateRow(current);
      }
    },
    [
      activateRow,
      expandedPaths,
      flatRows,
      focusPath,
      scrollRowIntoView,
      selectedScenePath,
      toggleExpand,
    ],
  );

  const expandAll = useCallback(() => {
    setExpandedPaths(collectAllExpandablePaths(extraction.sceneTree));
  }, [extraction.sceneTree]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  if (extraction.sceneTree.length === 0) {
    return (
      <p className="text-center text-[11px] text-zinc-500">No scene objects in this model.</p>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-end gap-1">
        <TRNButton
          type="button"
          size="compact"
          className="px-2 text-[9px]"
          hint="Expand every branch in the scene hierarchy."
          onClick={expandAll}
        >
          Expand all
        </TRNButton>
        <TRNButton
          type="button"
          size="compact"
          className="px-2 text-[9px]"
          hint="Collapse to root nodes only."
          onClick={collapseAll}
        >
          Collapse all
        </TRNButton>
      </div>
      <div
        ref={treeRef}
        tabIndex={0}
        role="tree"
        aria-label="Scene hierarchy"
        className="space-y-px rounded outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/35"
        onKeyDown={handleKeyDown}
      >
      {flatRows.map((row) => (
        <FlatTreeRow
          key={row.path}
          row={row}
          searchQuery={searchQuery}
          typeFilter={typeFilter}
          parentModelFlowNodeId={parentModelFlowNodeId}
          inlineCatalogAssetId={inlineCatalogAssetId ?? ""}
          placedRowKeys={placedRowKeys}
          selectedRowKey={selectedRowKey}
          selectedScenePath={selectedScenePath}
          focusPath={focusPath}
          canSpawn={canSpawn}
          rowRef={registerRowRef}
          onToggleExpand={toggleExpand}
          onRowSelect={onRowSelect}
          onSpawn={onSpawn}
        />
      ))}
      </div>
    </div>
  );
}
