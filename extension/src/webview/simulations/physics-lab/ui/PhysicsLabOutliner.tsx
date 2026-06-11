import { Box, Layers3 } from "lucide-react";
import type { PhysicsLabSceneObjectId } from "../store/physicsLabStore.js";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";

const OUTLINER_ROWS: { id: PhysicsLabSceneObjectId; label: string; detail: string }[] = [
  { id: "floor", label: "Floor", detail: "fixed · box collider" },
  { id: "dynamic-box", label: "Dynamic Box", detail: "dynamic · 1 m³" },
];

export function PhysicsLabOutliner() {
  const selectedObjectId = usePhysicsLabStore((s) => s.selectedObjectId);
  const selectObject = usePhysicsLabStore((s) => s.selectObject);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1.5 border-b border-zinc-800/90 px-2 py-1.5">
        <Layers3 className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
        <span className="text-[11px] font-semibold text-zinc-200">Outliner</span>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto scrollbar-hide p-1">
        {OUTLINER_ROWS.map((row) => {
          const active = selectedObjectId === row.id;
          return (
            <li key={row.id}>
              <button
                type="button"
                className={[
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition",
                  active
                    ? "bg-sky-500/15 text-sky-100 ring-1 ring-sky-500/35"
                    : "text-zinc-300 hover:bg-zinc-800/60",
                ].join(" ")}
                onClick={() => selectObject(row.id)}
              >
                <Box className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-medium">{row.label}</span>
                  <span className="block truncate text-[10px] text-zinc-500">{row.detail}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
