import { ArrowLeft, Pause, Play, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow.js";
import { TRNSegmentedControl } from "../../../ui/TRN/TRNSegmentedControl.js";
import {
  usePhysicsLabStore,
  type PhysicsLabWorkbenchMode,
} from "../store/physicsLabStore.js";

type PhysicsLabToolbarProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
};

const WORKBENCH_OPTIONS: { value: PhysicsLabWorkbenchMode; label: string }[] = [
  { value: "edit", label: "Edit" },
  { value: "simulate", label: "Simulate" },
];

export function PhysicsLabToolbar({ title, subtitle, onBack }: PhysicsLabToolbarProps) {
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const isPlaying = usePhysicsLabStore((s) => s.isPlaying);
  const undoStack = usePhysicsLabStore((s) => s.undoStack);
  const redoStack = usePhysicsLabStore((s) => s.redoStack);
  const showColliderWireframes = usePhysicsLabStore((s) => s.showColliderWireframes);
  const setWorkbenchMode = usePhysicsLabStore((s) => s.setWorkbenchMode);
  const togglePlaying = usePhysicsLabStore((s) => s.togglePlaying);
  const resetSimulation = usePhysicsLabStore((s) => s.resetSimulation);
  const undo = usePhysicsLabStore((s) => s.undo);
  const redo = usePhysicsLabStore((s) => s.redo);
  const setShowColliderWireframes = usePhysicsLabStore((s) => s.setShowColliderWireframes);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-4"
      data-physics-lab-chrome
    >
      <button
        type="button"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-950/85 px-3 py-2 text-sm font-medium text-zinc-100 shadow-lg backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </button>

      <div className="pointer-events-auto flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
        <TRNSegmentedControl
          size="sm"
          value={workbenchMode}
          options={WORKBENCH_OPTIONS}
          onValueChange={(value) => {
            if (value === "edit" || value === "simulate") {
              setWorkbenchMode(value);
            }
          }}
          ariaLabel="Workbench mode"
        />
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-950/85 px-2 py-1.5 text-[11px] font-medium text-zinc-100 shadow-lg backdrop-blur-sm transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canUndo || workbenchMode !== "edit"}
          onClick={undo}
        >
          <Undo2 className="h-3.5 w-3.5" aria-hidden />
          Undo
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-950/85 px-2 py-1.5 text-[11px] font-medium text-zinc-100 shadow-lg backdrop-blur-sm transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canRedo || workbenchMode !== "edit"}
          onClick={redo}
        >
          <Redo2 className="h-3.5 w-3.5" aria-hidden />
          Redo
        </button>
        <TRNInlineToggleRow
          className="rounded-lg border border-zinc-700/80 bg-zinc-950/85 px-2 py-0.5 shadow-lg backdrop-blur-sm"
          label="Wireframe"
          checked={showColliderWireframes}
          onCheckedChange={setShowColliderWireframes}
          hint="Show collider edges on selected bodies."
        />
        {workbenchMode === "simulate" ? (
          <>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-950/85 px-2.5 py-1.5 text-[11px] font-medium text-zinc-100 shadow-lg backdrop-blur-sm transition hover:border-zinc-500"
              onClick={togglePlaying}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" aria-hidden />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  Play
                </>
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-950/85 px-2.5 py-1.5 text-[11px] font-medium text-zinc-100 shadow-lg backdrop-blur-sm transition hover:border-zinc-500"
              onClick={resetSimulation}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          </>
        ) : null}
      </div>

      <div className="pointer-events-none min-w-[8rem] text-right">
        <p className="truncate text-sm font-semibold text-zinc-100">{title}</p>
        {subtitle != null && subtitle.length > 0 ? (
          <p className="truncate text-xs text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
