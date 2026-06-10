import { lazy, Suspense, useCallback, useRef, useState } from "react";
import type { DiagramV1 } from "../schemas/diagram.v1";
import { diagramHas3dLayer } from "../schemas/normalizeDiagramV1";
import { roundDiagram3dPosition } from "../runtime/diagram/diagram3dPositionSnap";
import type { Diagram3dTransformGizmoMode } from "../runtime/diagram/diagram3dGizmoHelpers";
import type { StudioViewportViewSnapId } from "../../sensor-studio/core/viewport/studio-viewport-view-snaps";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import {
  readStoredCourseDiagram3dGizmoMode,
  writeStoredCourseDiagram3dGizmoMode,
} from "./course-diagram-3d-viewport.persistence";
import { CourseDiagram3dNodeInspector } from "./CourseDiagram3dNodeInspector";
import { CourseDiagram3dViewportToolbar } from "./CourseDiagram3dViewportToolbar";
import { useCourseDiagram3dViewportShortcuts } from "./useCourseDiagram3dViewportShortcuts";
import { useCourseDiagram3dViewportPrefs } from "./useCourseDiagram3dViewportPrefs";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";

const CourseDiagram3DLayer = lazy(async () => {
  const mod = await import("../runtime/diagram/CourseDiagram3DLayer");
  return { default: mod.CourseDiagram3DLayer };
});

function ViewportLoadingFallback() {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center text-2xs text-[var(--text-muted)]">
      Loading 3D viewport…
    </div>
  );
}

export function CourseDiagram3dViewportEditor({
  diagramId,
  diagram,
  className,
  embedInspector = false,
}: {
  diagramId: string;
  diagram: DiagramV1;
  className?: string;
  embedInspector?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [gizmoMode, setGizmoMode] = useState<Diagram3dTransformGizmoMode>(() =>
    readStoredCourseDiagram3dGizmoMode(),
  );
  const [cameraResetNonce, setCameraResetNonce] = useState(0);
  const [captureViewNonce, setCaptureViewNonce] = useState(0);
  const [viewSnapNonce, setViewSnapNonce] = useState(0);
  const [viewSnapId, setViewSnapId] = useState<StudioViewportViewSnapId>("front");

  const selected3dNodeId = useCourseDiagramEditorStore(
    (s) => s.selected3dNodeIds[diagramId] ?? null,
  );
  const setSelected3dNodeId = useCourseDiagramEditorStore((s) => s.setSelected3dNodeId);
  const patch3dNode = useCourseDiagramEditorStore((s) => s.patch3dNode);
  const patch3dCamera = useCourseDiagramEditorStore((s) => s.patch3dCamera);

  const setGizmoModePersisted = useCallback((mode: Diagram3dTransformGizmoMode) => {
    setGizmoMode(mode);
    writeStoredCourseDiagram3dGizmoMode(mode);
  }, []);

  const onNodePositionCommit = useCallback(
    (nodeId: string, position: [number, number, number]) => {
      const [x, y, z] = roundDiagram3dPosition(position);
      patch3dNode(
        diagramId,
        nodeId,
        { positionX: x, positionY: y, positionZ: z },
        { recordUndo: true },
      );
    },
    [diagramId, patch3dNode],
  );

  const onNodeRotationCommit = useCallback(
    (nodeId: string, eulerDegrees: [number, number, number]) => {
      patch3dNode(
        diagramId,
        nodeId,
        { rotation: eulerDegrees },
        { recordUndo: true },
      );
    },
    [diagramId, patch3dNode],
  );

  const onNodeScaleCommit = useCallback(
    (nodeId: string, scale: [number, number, number]) => {
      patch3dNode(
        diagramId,
        nodeId,
        { scaleX: scale[0], scaleY: scale[1], scaleZ: scale[2] },
        { recordUndo: true },
      );
    },
    [diagramId, patch3dNode],
  );

  const onCaptureCameraView = useCallback(
    (position: [number, number, number]) => {
      const [x, y, z] = roundDiagram3dPosition(position);
      patch3dCamera(
        diagramId,
        { positionX: x, positionY: y, positionZ: z },
        { recordUndo: true },
      );
    },
    [diagramId, patch3dCamera],
  );

  const onViewSnap = useCallback((snap: StudioViewportViewSnapId) => {
    setViewSnapId(snap);
    setViewSnapNonce((nonce) => nonce + 1);
  }, []);

  const toggleProjection = useCourseDiagram3dViewportPrefs((s) => s.toggleProjection);

  useCourseDiagram3dViewportShortcuts({
    enabled: true,
    viewportRef,
    selectedNodeId: selected3dNodeId,
    onSetGizmoMode: setGizmoModePersisted,
    onViewSnap,
    onToggleProjection: toggleProjection,
  });

  if (!diagramHas3dLayer(diagram)) {
    return null;
  }

  return (
    <div className={`flex min-h-0 flex-col gap-3 ${className ?? ""}`}>
      <div
        ref={viewportRef}
        tabIndex={0}
        className="relative flex min-h-[220px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-amber)]/50"
        onPointerDown={() => viewportRef.current?.focus()}
      >
        <div className="relative min-h-0 flex-1">
          <Suspense fallback={<ViewportLoadingFallback />}>
            <CourseDiagram3DLayer
              diagram={diagram}
              designTime
              className="absolute inset-0 h-full"
              selectedModelId={selected3dNodeId}
              gizmoMode={gizmoMode}
              cameraResetNonce={cameraResetNonce}
              captureViewNonce={captureViewNonce}
              viewSnapNonce={viewSnapNonce}
              viewSnapId={viewSnapId}
              onCaptureCameraView={onCaptureCameraView}
              onSelectModelId={(nodeId) => setSelected3dNodeId(diagramId, nodeId)}
              onNodePositionCommit={onNodePositionCommit}
              onNodeRotationCommit={onNodeRotationCommit}
              onNodeScaleCommit={onNodeScaleCommit}
            />
          </Suspense>
          <CourseDiagram3dViewportToolbar
            diagram={diagram}
            selectedNodeId={selected3dNodeId}
            gizmoMode={gizmoMode}
            onGizmoModeChange={setGizmoModePersisted}
            onClearSelection={() => setSelected3dNodeId(diagramId, null)}
            onResetCamera={() => setCameraResetNonce((nonce) => nonce + 1)}
            onSaveCameraView={() => setCaptureViewNonce((nonce) => nonce + 1)}
          />
        </div>
      </div>
      {embedInspector ? (
        <CourseDiagram3dNodeInspector diagramId={diagramId} diagram={diagram} />
      ) : (
        <TRNHintText>
          Move · Rotate · Scale (G / R / S). 5 toggles perspective / orthographic. 1 / 3 / 7 / 9
          (numpad or number row) snap front/right/top/back views. Save view stores orbit camera;
          Reset camera restores the diagram default.
        </TRNHintText>
      )}
    </div>
  );
}
