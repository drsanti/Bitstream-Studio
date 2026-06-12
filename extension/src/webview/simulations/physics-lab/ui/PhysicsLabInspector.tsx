import { useRef } from "react";
import { TRNHintText } from "../../../ui/TRN/TRNHintText.js";
import {
  downloadPhysicsLabSceneJson,
  exportPhysicsLabSceneDocument,
} from "../serialization/physicsLabSceneDocument.js";
import { usePhysicsLabStore, physicsLabBodyById } from "../store/physicsLabStore.js";
import { physicsLabBodySummary } from "../types/physicsLabBody.js";

export function PhysicsLabInspector() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const isPlaying = usePhysicsLabStore((s) => s.isPlaying);
  const authoringMode = usePhysicsLabStore((s) => s.authoringMode);
  const gizmoMode = usePhysicsLabStore((s) => s.gizmoMode);
  const projectionMode = usePhysicsLabStore((s) => s.projectionMode);
  const selectedIds = usePhysicsLabStore((s) => s.selectedIds);
  const activeId = usePhysicsLabStore((s) => s.activeId);
  const bodies = usePhysicsLabStore((s) => s.bodies);
  const showColliderWireframes = usePhysicsLabStore((s) => s.showColliderWireframes);
  const loadSceneDocument = usePhysicsLabStore((s) => s.loadSceneDocument);

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
          <div className="flex justify-between gap-2">
            <dt>Authoring</dt>
            <dd className="text-zinc-300 capitalize">{authoringMode}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Gizmo</dt>
            <dd className="text-zinc-300 capitalize">{gizmoMode}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Projection</dt>
            <dd className="text-zinc-300 capitalize">{projectionMode}</dd>
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
        <h3 className="text-[11px] font-semibold text-zinc-200">Scene document</h3>
        <TRNHintText className="mt-1">
          Save/load JSON scene (v1). Press <strong>5</strong> to toggle perspective / orthographic.
        </TRNHintText>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            className="rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-200 hover:border-zinc-500"
            onClick={() => {
              downloadPhysicsLabSceneJson(exportPhysicsLabSceneDocument(bodies));
            }}
          >
            Download JSON
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-200 hover:border-zinc-500"
            onClick={() => fileInputRef.current?.click()}
          >
            Load JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file == null) {
                return;
              }
              void file.text().then((text) => {
                try {
                  loadSceneDocument(text);
                } catch (error) {
                  console.error("[PhysicsLab] load scene failed", error);
                }
              });
              event.target.value = "";
            }}
          />
        </div>
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
              <dt>Position</dt>
              <dd className="text-right text-zinc-300">
                {activeBody.position.map((v) => v.toFixed(2)).join(", ")}
              </dd>
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
