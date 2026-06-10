import { Camera, Move3d, RotateCcw, RotateCw, Scaling, X } from "lucide-react";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import type { DiagramV1 } from "../schemas/diagram.v1";
import type { Diagram3dTransformGizmoMode } from "../runtime/diagram/diagram3dGizmoHelpers";
import {
  canDiagram3dNodeUseRotateGizmo,
  DIAGRAM_3D_GIZMO_MODES,
} from "../runtime/diagram/diagram3dGizmoHelpers";
import {
  findDiagram3dNode,
  listDiagram3dNodes,
} from "../runtime/diagram/diagram3dNodeMutations";

const TOOLBAR_HINT_DELAY_MS = 400;

const VIEWPORT_TOOLBAR_PILL_CLASS =
  "pointer-events-none absolute left-1/2 top-3 z-[60] flex w-max max-w-[min(96vw,40rem)] -translate-x-1/2 flex-nowrap items-center justify-center gap-1 overflow-x-auto scrollbar-hide rounded-full border border-amber-400/25 bg-zinc-950/88 px-1.5 py-1 shadow-lg backdrop-blur-md";

const VIEWPORT_TOOLBAR_DIVIDER_CLASS = "pointer-events-none h-3.5 w-px shrink-0 bg-zinc-700/80";

const VIEWPORT_TOOLBAR_STATUS_CLASS =
  "pointer-events-none max-w-[10rem] shrink truncate px-1.5 text-[10px] font-medium text-amber-100/85";

const VIEWPORT_ICON_BUTTON_CLASS =
  "!h-7 !w-7 !rounded-full !border-0 !bg-transparent hover:!bg-zinc-800/60";

const GIZMO_MODES: {
  mode: Diagram3dTransformGizmoMode;
  icon: typeof Move3d;
  label: string;
  shortcut: string;
}[] = [
  { mode: "translate", icon: Move3d, label: "Move", shortcut: "G" },
  { mode: "rotate", icon: RotateCw, label: "Rotate", shortcut: "R" },
  { mode: "scale", icon: Scaling, label: "Scale", shortcut: "S" },
];

function gizmoIconClass(active: boolean, disabled: boolean): string {
  if (disabled) {
    return "text-zinc-600";
  }
  return active ? "text-sky-300" : "text-zinc-500";
}

function GizmoIconButtons({
  gizmoMode,
  gizmoInteractive,
  rotateAllowed,
  onGizmoModeChange,
  presetHint,
}: {
  gizmoMode: Diagram3dTransformGizmoMode;
  gizmoInteractive: boolean;
  rotateAllowed: boolean;
  onGizmoModeChange?: (mode: Diagram3dTransformGizmoMode) => void;
  presetHint?: string;
}) {
  if (onGizmoModeChange == null && presetHint == null) {
    return null;
  }

  const presetLocked = presetHint != null;

  return (
    <>
      <span className={VIEWPORT_TOOLBAR_DIVIDER_CLASS} aria-hidden />
      {GIZMO_MODES.filter(({ mode }) => DIAGRAM_3D_GIZMO_MODES.includes(mode)).map(
        ({ mode, icon: Icon, label, shortcut }) => {
          const disabled =
            presetLocked ||
            !gizmoInteractive ||
            (mode === "rotate" && !rotateAllowed);
          const active = !presetLocked && gizmoInteractive && gizmoMode === mode;
          return (
            <TRNIconButton
              key={mode}
              icon={
                <Icon size={14} className={gizmoIconClass(active, disabled)} aria-hidden />
              }
              label={label}
              disabled={disabled}
              hint={
                presetHint ??
                (!gizmoInteractive
                  ? `Select a model or group first (${shortcut})`
                  : disabled
                    ? "Rotate gizmo requires static euler rotation (no live quaternion bindings)"
                    : `${label} (${shortcut})`)
              }
              hintPlacement="bottom"
              hintDelayMs={TOOLBAR_HINT_DELAY_MS}
              aria-pressed={active}
              nativeTitle={false}
              onClick={() => onGizmoModeChange?.(mode)}
              className={
                active && !disabled
                  ? `${VIEWPORT_ICON_BUTTON_CLASS} !bg-sky-500/15`
                  : VIEWPORT_ICON_BUTTON_CLASS
              }
            />
          );
        },
      )}
    </>
  );
}

function CameraIconButtons({
  presetHint,
  onSaveCameraView,
  onResetCamera,
}: {
  presetHint?: string;
  onSaveCameraView?: () => void;
  onResetCamera?: () => void;
}) {
  if (presetHint == null && onSaveCameraView == null && onResetCamera == null) {
    return null;
  }

  const presetLocked = presetHint != null;

  return (
    <>
      <span className={VIEWPORT_TOOLBAR_DIVIDER_CLASS} aria-hidden />
      <TRNIconButton
        icon={<Camera size={14} className="text-zinc-400" aria-hidden />}
        label="Save view"
        disabled={presetLocked || onSaveCameraView == null}
        hint={presetHint ?? "Store current orbit position as the diagram default camera"}
        hintPlacement="bottom"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        nativeTitle={false}
        onClick={onSaveCameraView}
        className={VIEWPORT_ICON_BUTTON_CLASS}
      />
      <TRNIconButton
        icon={<RotateCcw size={14} className="text-zinc-400" aria-hidden />}
        label="Reset camera"
        disabled={presetLocked || onResetCamera == null}
        hint={presetHint ?? "Reset orbit camera to diagram default"}
        hintPlacement="bottom"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        nativeTitle={false}
        onClick={onResetCamera}
        className={VIEWPORT_ICON_BUTTON_CLASS}
      />
    </>
  );
}

export function CourseDiagram3dViewportToolbar({
  diagram,
  selectedNodeId,
  gizmoMode = "translate",
  onGizmoModeChange,
  onClearSelection,
  onResetCamera,
  onSaveCameraView,
}: {
  diagram: DiagramV1;
  selectedNodeId: string | null;
  gizmoMode?: Diagram3dTransformGizmoMode;
  onGizmoModeChange?: (mode: Diagram3dTransformGizmoMode) => void;
  onClearSelection?: () => void;
  onResetCamera?: () => void;
  onSaveCameraView?: () => void;
}) {
  const entries = listDiagram3dNodes(diagram);
  const selected = selectedNodeId != null ? findDiagram3dNode(diagram, selectedNodeId) : null;
  const selectedLabel =
    selected == null
      ? null
      : selected.type === "group3d"
        ? `${selected.id} · group`
        : `${selected.id} · ${selected.modelId}`;
  const rotateAllowed =
    selected != null && canDiagram3dNodeUseRotateGizmo(selected.rotation);
  const gizmoInteractive = selectedNodeId != null && onGizmoModeChange != null;

  const statusLabel =
    selectedLabel ??
    (entries.length === 0
      ? "No 3D objects"
      : `${entries.length} object${entries.length === 1 ? "" : "s"} · click to select`);

  return (
    <div className={VIEWPORT_TOOLBAR_PILL_CLASS} role="toolbar" aria-label="3D design viewport">
      <span className={VIEWPORT_TOOLBAR_STATUS_CLASS}>{statusLabel}</span>

      <GizmoIconButtons
        gizmoMode={gizmoMode}
        gizmoInteractive={gizmoInteractive}
        rotateAllowed={rotateAllowed}
        onGizmoModeChange={onGizmoModeChange}
      />

      <CameraIconButtons
        onSaveCameraView={onSaveCameraView}
        onResetCamera={onResetCamera}
      />

      {selectedNodeId != null && onClearSelection != null ? (
        <>
          <span className={VIEWPORT_TOOLBAR_DIVIDER_CLASS} aria-hidden />
          <TRNIconButton
            icon={<X size={14} className="text-zinc-400" aria-hidden />}
            label="Clear selection"
            hint="Clear viewport selection"
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            nativeTitle={false}
            onClick={onClearSelection}
            className={VIEWPORT_ICON_BUTTON_CLASS}
          />
        </>
      ) : null}
    </div>
  );
}
