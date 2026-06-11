import { usePhysicsLabStore } from "../store/physicsLabStore.js";

export function PhysicsLabInspector() {
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const isPlaying = usePhysicsLabStore((s) => s.isPlaying);
  const selectedObjectId = usePhysicsLabStore((s) => s.selectedObjectId);

  const selectionLabel =
    selectedObjectId === "floor"
      ? "Floor"
      : selectedObjectId === "dynamic-box"
        ? "Dynamic Box"
        : "None";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-2">
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
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-2">
        <h3 className="text-[11px] font-semibold text-zinc-200">Selection</h3>
        <p className="mt-2 text-[11px] text-zinc-300">{selectionLabel}</p>
        {selectedObjectId === "dynamic-box" ? (
          <dl className="mt-2 space-y-1 text-[10px] text-zinc-400">
            <div className="flex justify-between gap-2">
              <dt>Motion</dt>
              <dd className="text-zinc-300">Dynamic</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Mass</dt>
              <dd className="text-zinc-300">Default density</dd>
            </div>
          </dl>
        ) : selectedObjectId === "floor" ? (
          <dl className="mt-2 space-y-1 text-[10px] text-zinc-400">
            <div className="flex justify-between gap-2">
              <dt>Motion</dt>
              <dd className="text-zinc-300">Fixed</dd>
            </div>
          </dl>
        ) : null}
      </section>
    </div>
  );
}
