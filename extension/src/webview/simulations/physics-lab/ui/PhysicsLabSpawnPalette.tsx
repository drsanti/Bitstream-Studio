import { Box, Circle, Component, Plus } from "lucide-react";
import type { PhysicsLabShapeKind } from "../types/physicsLabBody.js";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";

const SPAWN_ITEMS: {
  shape: PhysicsLabShapeKind;
  label: string;
  icon: typeof Box;
}[] = [
  { shape: "box", label: "Box", icon: Box },
  { shape: "sphere", label: "Sphere", icon: Circle },
  { shape: "capsule", label: "Capsule", icon: Component },
];

export function PhysicsLabSpawnPalette() {
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const spawnBody = usePhysicsLabStore((s) => s.spawnBody);
  const disabled = workbenchMode !== "edit";

  return (
    <div className="mb-2 border-b border-zinc-800/90 pb-2" data-physics-lab-chrome>
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <Plus className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
        <span className="text-[11px] font-semibold text-zinc-200">Spawn</span>
      </div>
      <div className="grid grid-cols-3 gap-1 px-1">
        {SPAWN_ITEMS.map(({ shape, label, icon: Icon }) => (
          <button
            key={shape}
            type="button"
            disabled={disabled}
            className="flex flex-col items-center gap-1 rounded-md border border-zinc-800/90 bg-zinc-950/50 px-1 py-1.5 text-[10px] font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900/80 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => spawnBody(shape)}
          >
            <Icon className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
