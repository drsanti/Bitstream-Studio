import { Box, GripVertical, Layers3 } from "lucide-react";
import { useCallback, useState } from "react";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";
import { physicsLabBodySummary } from "../types/physicsLabBody.js";
import { sortPhysicsLabBodies } from "../utils/physicsLabMath.js";

export function PhysicsLabOutliner() {
  const bodies = usePhysicsLabStore((s) => s.bodies);
  const selectedIds = usePhysicsLabStore((s) => s.selectedIds);
  const activeId = usePhysicsLabStore((s) => s.activeId);
  const pickBody = usePhysicsLabStore((s) => s.pickBody);
  const reorderBody = usePhysicsLabStore((s) => s.reorderBody);

  const sortedBodies = sortPhysicsLabBodies(bodies);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const commitDrop = useCallback(
    (targetIndex: number) => {
      if (dragId == null) {
        return;
      }
      reorderBody(dragId, targetIndex);
      setDragId(null);
      setDropIndex(null);
    },
    [dragId, reorderBody],
  );

  return (
    <div className="flex h-full min-h-0 flex-col" data-physics-lab-chrome>
      <div className="flex items-center gap-1.5 border-b border-zinc-800/90 px-2 py-1.5">
        <Layers3 className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
        <span className="text-[11px] font-semibold text-zinc-200">Outliner</span>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto scrollbar-hide p-1">
        {sortedBodies.map((body, index) => {
          const selected = selectedIds.includes(body.id);
          const active = activeId === body.id;
          const isDropTarget = dropIndex === index && dragId != null && dragId !== body.id;
          return (
            <li key={body.id}>
              <div
                className={[
                  "flex w-full items-start gap-1 rounded-md transition",
                  isDropTarget ? "ring-1 ring-sky-500/50" : "",
                ].join(" ")}
                onDragOver={(event) => {
                  if (dragId == null || dragId === body.id) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropIndex(index);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  commitDrop(index);
                }}
              >
                <button
                  type="button"
                  draggable
                  className="mt-1.5 shrink-0 cursor-grab px-0.5 text-zinc-500 active:cursor-grabbing"
                  aria-label={`Reorder ${body.label}`}
                  onDragStart={(event) => {
                    setDragId(body.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", body.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setDropIndex(null);
                  }}
                >
                  <GripVertical className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  className={[
                    "flex min-w-0 flex-1 items-start gap-2 rounded-md px-2 py-1.5 text-left transition",
                    active
                      ? "bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/35"
                      : selected
                        ? "bg-sky-500/15 text-sky-100 ring-1 ring-sky-500/35"
                        : "text-zinc-300 hover:bg-zinc-800/60",
                  ].join(" ")}
                  onClick={(event) => {
                    pickBody(body.id, {
                      extend: event.shiftKey,
                      toggle: event.ctrlKey || event.metaKey,
                    });
                  }}
                >
                  <Box className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium">{body.label}</span>
                    <span className="block truncate text-[10px] text-zinc-500">
                      {physicsLabBodySummary(body)}
                    </span>
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
