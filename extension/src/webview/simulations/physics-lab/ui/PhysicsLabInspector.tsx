import { usePhysicsLabStore, physicsLabBodyById } from "../store/physicsLabStore.js";
import { physicsLabBodySummary } from "../types/physicsLabBody.js";

export function PhysicsLabInspector() {
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const isPlaying = usePhysicsLabStore((s) => s.isPlaying);
  const selectedIds = usePhysicsLabStore((s) => s.selectedIds);
  const activeId = usePhysicsLabStore((s) => s.activeId);
  const bodies = usePhysicsLabStore((s) => s.bodies);
  const showColliderWireframes = usePhysicsLabStore((s) => s.showColliderWireframes);

  const activeBody = activeId != null ? physicsLabBodyById(bodies, activeId) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-2" data-physics-lab-chrome>
      <section className="rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-2">
        <h3 className="text-[11px] font-semibold text-zinc-200">World</h3>
        <dl className="mt-2 space-y-1 text-[10px] text-zinc-400">
          <div className="flex justify-between gap-2">
            <dt>Gravity</dt>
            <dd className="text-zinc-300">0, −9.81, 0</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Timestep</dt>
            <dd className="text-zinc-300">60 Hz</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Mode</dt>
            <dd className="text-zinc-300">{workbenchMode === "edit" ? "Edit" : "Simulate"}</dd>
          </div>
          {workbenchMode === "simulate" ? (
            <div className="flex justify-between gap-2">
              <dt>Playback</dt>
              <dd className="text-zinc-300">{isPlaying ? "Playing" : "Paused"}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt>Collider wire</dt>
            <dd className="text-zinc-300">{showColliderWireframes ? "On" : "Off"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-2">
        <h3 className="text-[11px] font-semibold text-zinc-200">Selection</h3>
        {selectedIds.length === 0 ? (
          <p className="mt-2 text-[11px] text-zinc-500">None</p>
        ) : selectedIds.length > 1 ? (
          <p className="mt-2 text-[11px] text-zinc-300">{selectedIds.length} objects</p>
        ) : (
          <p className="mt-2 text-[11px] text-zinc-300">{activeBody?.label ?? selectedIds[0]}</p>
        )}
        {activeBody != null ? (
          <dl className="mt-2 space-y-1 text-[10px] text-zinc-400">
            <div className="flex justify-between gap-2">
              <dt>Shape</dt>
              <dd className="text-zinc-300">{activeBody.shape}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Motion</dt>
              <dd className="text-zinc-300">{activeBody.motion}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Summary</dt>
              <dd className="text-right text-zinc-300">{physicsLabBodySummary(activeBody)}</dd>
            </div>
          </dl>
        ) : null}
      </section>
    </div>
  );
}
