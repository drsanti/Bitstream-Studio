import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export type TRNTreeNode = {
  id: string;
  label: string;
  children?: TRNTreeNode[];
  disabled?: boolean;
};

type TRNTreeProps = {
  data: TRNTreeNode[];
  defaultExpanded?: readonly string[] | null;
  expanded?: ReadonlySet<string> | null;
  onExpandedChange?: (next: Set<string>) => void;
  className?: string;
  itemClassName?: string;
  /** Render after label (e.g. actions). */
  renderActions?: (node: TRNTreeNode) => ReactNode;
  /** Per-node custom label content. */
  renderLabel?: (node: TRNTreeNode) => ReactNode;
};

/**
 * Renders a nested, keyboard-friendly tree. Local expansion state is used
 * when `expanded` is not provided.
 */
export function TRNTree(props: TRNTreeProps) {
  const {
    data,
    defaultExpanded = null,
    expanded: controlled,
    onExpandedChange,
    className = "",
    itemClassName = "",
    renderActions,
    renderLabel,
  } = props;
  const isControlled = controlled != null;
  const [internal, setInternal] = useState<Set<string>>(
    () => new Set(defaultExpanded ?? []),
  );
  const openSet = isControlled ? controlled! : internal;

  const setOpen = useCallback(
    (next: Set<string>) => {
      if (!isControlled) {
        setInternal(new Set(next));
      }
      onExpandedChange?.(new Set(next));
    },
    [isControlled, onExpandedChange],
  );

  const toggle = useCallback(
    (id: string) => {
      const n = new Set(openSet);
      if (n.has(id)) {
        n.delete(id);
      }
      else {
        n.add(id);
      }
      setOpen(n);
    },
    [openSet, setOpen],
  );

  return (
    <ul
      className={"list-none m-0 p-0 text-xs space-y-0.5 " + className}
      role="tree"
    >
      {data.map((node) => (
        <TreeBranch
          key={node.id}
          node={node}
          depth={0}
          openSet={openSet}
          onToggle={toggle}
          itemClassName={itemClassName}
          renderActions={renderActions}
          renderLabel={renderLabel}
        />
      ))}
    </ul>
  );
}

type TreeBranchProps = {
  node: TRNTreeNode;
  depth: number;
  openSet: ReadonlySet<string>;
  onToggle: (id: string) => void;
  itemClassName: string;
  renderActions?: (node: TRNTreeNode) => ReactNode;
  renderLabel?: (node: TRNTreeNode) => ReactNode;
};

function TreeBranch(props: TreeBranchProps) {
  const {
    node,
    depth,
    openSet,
    onToggle,
    itemClassName,
    renderActions,
    renderLabel,
  } = props;
  const hasChild = (node.children?.length ?? 0) > 0;
  const isOpen = hasChild && openSet.has(node.id);
  return (
    <li role="none" className="select-none">
      <div
        role="treeitem"
        aria-expanded={hasChild ? isOpen : undefined}
        className={
          "flex items-center gap-1 py-0.5 rounded px-1 -mx-1 " +
          (node.disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-zinc-800/60")
        }
        style={{ paddingLeft: depth * 10 }}
      >
        {hasChild ? (
          <button
            type="button"
            className={
              "p-0.5 rounded border border-transparent hover:border-zinc-700/80 " +
              itemClassName
            }
            onClick={() => onToggle(node.id)}
            disabled={node.disabled}
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className="h-3.5 w-3.5 transition-transform text-zinc-400"
              style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            />
          </button>
        ) : (
          <span className="inline-block w-5" />
        )}
        <span
          className="flex-1 min-w-0 text-zinc-100"
          onDoubleClick={() => {
            if (hasChild) {
              onToggle(node.id);
            }
          }}
        >
          {renderLabel != null ? renderLabel(node) : node.label}
        </span>
        {renderActions != null ? (
          <span className="shrink-0">{renderActions(node)}</span>
        ) : null}
      </div>
      {hasChild && isOpen ? (
        <ul
          className="list-none m-0 p-0 pl-1 border-l border-zinc-700/40 ml-2.5"
          role="group"
        >
          {node.children!.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              openSet={openSet}
              onToggle={onToggle}
              itemClassName={itemClassName}
              renderActions={renderActions}
              renderLabel={renderLabel}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}