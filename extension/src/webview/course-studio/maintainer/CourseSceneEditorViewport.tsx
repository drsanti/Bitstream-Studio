import { useCallback, useEffect, useRef, useState } from "react";
import { CourseDiagram3DLayer } from "../runtime/diagram/CourseDiagram3DLayer";
import type { SceneV1 } from "../schemas/scene.v1";
import { roundDiagram3dPosition } from "../runtime/diagram/diagram3dPositionSnap";
import { scene3dViewportMarqueeIsDrag } from "../runtime/scene/scene3dViewportBoxSelection";
import type { Diagram3dTransformGizmoMode } from "../runtime/diagram/diagram3dGizmoHelpers";
import type { StudioViewportViewSnapId } from "../../sensor-studio/core/viewport/studio-viewport-view-snaps";
import { CourseSceneAddMenu } from "./CourseSceneAddMenu";
import { CourseSceneObjectRail } from "./CourseSceneObjectRail";
import { CourseSceneParentMenu } from "./CourseSceneParentMenu";
import { CourseSceneClearParentMenu } from "./CourseSceneClearParentMenu";
import {
  readStoredCourseDiagram3dGizmoMode,
  writeStoredCourseDiagram3dGizmoMode,
} from "./course-diagram-3d-viewport.persistence";
import { CourseSceneNodeInspector } from "./CourseSceneNodeInspector";
import { CourseScene3dViewportToolbar } from "./CourseScene3dViewportToolbar";
import { useSceneNodeSelection } from "./useSceneNodeSelection";
import { useCourseTelemetryLinkState } from "../runtime/useCourseTelemetryLinkState";
import { sceneUsesLiveBinding } from "../runtime/scene/sceneLiveBinding";
import {
  COURSE_CATALOG_STATUS_CHIP_CLASS,
  courseLiveCanvasStatusLabel,
} from "../ui/catalog/course-catalog-ui";
import { formatScene3dEditorShortcutsHint } from "../runtime/scene/scene3dEditorShortcuts";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { useCourseDiagram3dViewportPrefs } from "./useCourseDiagram3dViewportPrefs";
import { useCourseDiagram3dViewportShortcuts } from "./useCourseDiagram3dViewportShortcuts";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";
import { sceneV1ToDiagramV1 } from "../runtime/scene/sceneDiagramBridge";
import { useCourseSceneViewportInteraction } from "./useCourseSceneViewportInteraction";
import {
  installScene3dEditorShortcuts,
  registerScene3dEditorShortcutHandlers,
} from "./scene3dEditorShortcutBridge";

export function CourseSceneEditorViewport({
  documentId,
  scene,
  className,
  embedInspector = false,
}: {
  documentId: string;
  scene: SceneV1;
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
  const [addMenuAnchor, setAddMenuAnchor] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);

  const [parentMenuAnchor, setParentMenuAnchor] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const [clearParentMenuAnchor, setClearParentMenuAnchor] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);

  const {
    selectedNodeIds,
    activeNodeId,
    selectedNodeId,
    pickSceneNode,
    clearSceneSelection,
  } = useSceneNodeSelection(documentId);
  const addNode = useCourseSceneEditorStore((s) => s.addNode);
  const duplicateSelectedNodes = useCourseSceneEditorStore((s) => s.duplicateSelectedNodes);
  const removeNodes = useCourseSceneEditorStore((s) => s.removeNodes);
  const groupSelectedNodes = useCourseSceneEditorStore((s) => s.groupSelectedNodes);
  const parentSelectedToActive = useCourseSceneEditorStore((s) => s.parentSelectedToActive);
  const clearParentForSelected = useCourseSceneEditorStore((s) => s.clearParentForSelected);
  const patchCamera = useCourseSceneEditorStore((s) => s.patchCamera);
  const usesLive = sceneUsesLiveBinding(scene);
  const { healthy } = useCourseTelemetryLinkState();
  const liveActive = usesLive && healthy;

  const {
    canvasAreaRef,
    marqueeBox,
    onCanvasPointerDownCapture,
    onNodePointerDown,
    onGizmoPointerDown,
    onGizmoDragStart,
    onMultiGizmoDragStart,
    onMultiGizmoCommit,
    onRegisterBoxSelectProjector,
    onNodePositionCommit,
    onNodeRotationCommit,
    onNodeScaleCommit,
  } = useCourseSceneViewportInteraction({
    documentId,
    clearSceneSelection,
  });

  const setGizmoModePersisted = useCallback((mode: Diagram3dTransformGizmoMode) => {
    setGizmoMode(mode);
    writeStoredCourseDiagram3dGizmoMode(mode);
  }, []);

  const onCaptureCameraView = useCallback(
    (position: [number, number, number]) => {
      const [x, y, z] = roundDiagram3dPosition(position);
      patchCamera(documentId, { positionX: x, positionY: y, positionZ: z }, { recordUndo: true });
    },
    [documentId, patchCamera],
  );

  const openAddMenu = useCallback((anchor: { clientX: number; clientY: number }) => {
    setAddMenuAnchor(anchor);
  }, []);

  const closeAddMenu = useCallback(() => {
    setAddMenuAnchor(null);
  }, []);

  const onViewSnap = useCallback((snap: StudioViewportViewSnapId) => {
    setViewSnapId(snap);
    setViewSnapNonce((nonce) => nonce + 1);
  }, []);

  const toggleProjection = useCourseDiagram3dViewportPrefs((s) => s.toggleProjection);

  const closeParentMenu = useCallback(() => {
    setParentMenuAnchor(null);
  }, []);

  const closeClearParentMenu = useCallback(() => {
    setClearParentMenuAnchor(null);
  }, []);

  const openParentMenu = useCallback((anchor: { clientX: number; clientY: number }) => {
    setClearParentMenuAnchor(null);
    setParentMenuAnchor(anchor);
  }, []);

  const openClearParentMenu = useCallback((anchor: { clientX: number; clientY: number }) => {
    setParentMenuAnchor(null);
    setClearParentMenuAnchor(anchor);
  }, []);

  const openParentMenuCenter = useCallback(() => {
    if (selectedNodeIds.length === 0) {
      return;
    }
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect == null) {
      return;
    }
    openParentMenu({
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    });
  }, [openParentMenu, selectedNodeIds.length]);

  const openClearParentMenuCenter = useCallback(() => {
    if (selectedNodeIds.length === 0) {
      return;
    }
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect == null) {
      return;
    }
    openClearParentMenu({
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    });
  }, [openClearParentMenu, selectedNodeIds.length]);

  useEffect(() => {
    installScene3dEditorShortcuts();
    registerScene3dEditorShortcutHandlers({
      group:
        selectedNodeIds.length > 0 ? () => groupSelectedNodes(documentId) : undefined,
      openParentMenu:
        selectedNodeIds.length > 0 ? openParentMenuCenter : undefined,
      openClearParentMenu:
        selectedNodeIds.length > 0 ? openClearParentMenuCenter : undefined,
    });
    return () => registerScene3dEditorShortcutHandlers({});
  }, [
    documentId,
    groupSelectedNodes,
    openClearParentMenuCenter,
    openParentMenuCenter,
    selectedNodeIds.length,
  ]);

  useCourseDiagram3dViewportShortcuts({
    enabled: true,
    viewportRef,
    selectedNodeId: activeNodeId,
    onSetGizmoMode: setGizmoModePersisted,
    onViewSnap,
    onToggleProjection: toggleProjection,
    onDuplicate:
      selectedNodeIds.length > 0
        ? () => duplicateSelectedNodes(documentId)
        : undefined,
    onDelete:
      selectedNodeIds.length > 0
        ? () => removeNodes(documentId, selectedNodeIds)
        : undefined,
    onOpenAddMenu: openAddMenu,
    addMenuOpen: addMenuAnchor != null,
    parentMenuOpen: parentMenuAnchor != null,
    clearParentMenuOpen: clearParentMenuAnchor != null,
    onCloseAddMenu: closeAddMenu,
    onCloseParentMenu: closeParentMenu,
    onCloseClearParentMenu: closeClearParentMenu,
  });
  return (
    <div className={`flex min-h-0 flex-col gap-2 ${className ?? ""}`}>
      <div
        ref={viewportRef}
        tabIndex={0}
        className="relative flex min-h-[220px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)] outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent-amber)]/50"
        onPointerDown={() => viewportRef.current?.focus()}
        onContextMenu={(event) => {
          if (event.target instanceof Element && event.target.closest(".course-scene-object-rail")) {
            return;
          }
          event.preventDefault();
          openAddMenu({ clientX: event.clientX, clientY: event.clientY });
        }}
      >
        <div
          ref={canvasAreaRef}
          className="relative flex min-h-0 flex-1 flex-col"
          onPointerDownCapture={onCanvasPointerDownCapture}
        >
          <CourseDiagram3DLayer
            diagram={sceneV1ToDiagramV1(scene)}
            scene={scene}
            designTime
            environmentSettings={scene.settings}
            className="min-h-0 flex-1"
            selectedModelIds={selectedNodeIds}
            activeModelId={activeNodeId}
            gizmoMode={gizmoMode}
            cameraResetNonce={cameraResetNonce}
            captureViewNonce={captureViewNonce}
            viewSnapNonce={viewSnapNonce}
            viewSnapId={viewSnapId}
            onCaptureCameraView={onCaptureCameraView}
            onSelectModelId={(nodeId, extend) => pickSceneNode(nodeId, extend ?? false)}
            onNodePointerDown={onNodePointerDown}
            onGizmoPointerDown={onGizmoPointerDown}
            onGizmoDragStart={onGizmoDragStart}
            onMultiGizmoDragStart={onMultiGizmoDragStart}
            onMultiGizmoCommit={onMultiGizmoCommit}
            onRegisterBoxSelectProjector={onRegisterBoxSelectProjector}
            onNodePositionCommit={onNodePositionCommit}
            onNodeRotationCommit={onNodeRotationCommit}
            onNodeScaleCommit={onNodeScaleCommit}
          />
          <CourseSceneObjectRail
            documentId={documentId}
            selectedNodeIds={selectedNodeIds}
            addMenuOpen={addMenuAnchor != null}
            onOpenAddMenu={openAddMenu}
            onGroupSelected={
              selectedNodeIds.length > 0 ? () => groupSelectedNodes(documentId) : undefined
            }
            onOpenParentMenu={
              selectedNodeIds.length > 0 ? (anchor) => openParentMenu(anchor) : undefined
            }
            onOpenClearParentMenu={
              selectedNodeIds.length > 0 ? (anchor) => openClearParentMenu(anchor) : undefined
            }
          />
          <CourseScene3dViewportToolbar
            scene={scene}
            selectedNodeId={selectedNodeId}
            gizmoMode={gizmoMode}
            onGizmoModeChange={setGizmoModePersisted}
            onClearSelection={() => clearSceneSelection()}
            onResetCamera={() => setCameraResetNonce((nonce) => nonce + 1)}
            onSaveCameraView={() => setCaptureViewNonce((nonce) => nonce + 1)}
          />
          {usesLive ? (
            <span
              className={`pointer-events-none absolute left-2 top-2 z-10 ${COURSE_CATALOG_STATUS_CHIP_CLASS}`}
              style={{
                color: liveActive ? "var(--status-live)" : "var(--text-muted)",
                borderColor: liveActive
                  ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
                  : "var(--surface-border)",
              }}
            >
              {courseLiveCanvasStatusLabel(usesLive, liveActive)}
            </span>
          ) : null}
          {marqueeBox != null && scene3dViewportMarqueeIsDrag(marqueeBox) ? (
            <div
              className="pointer-events-none absolute z-20 border border-sky-400/80 bg-sky-400/10"
              style={{
                left: marqueeBox.x,
                top: marqueeBox.y,
                width: marqueeBox.width,
                height: marqueeBox.height,
              }}
              aria-hidden
            />
          ) : null}
        </div>
        <TRNHintText className="shrink-0 px-0.5 text-[10px]! text-zinc-500">
          {formatScene3dEditorShortcutsHint()}
        </TRNHintText>
      </div>
      {addMenuAnchor != null ? (
        <CourseSceneAddMenu
          clientX={addMenuAnchor.clientX}
          clientY={addMenuAnchor.clientY}
          onPickNode={(node) => addNode(documentId, node)}
          onClose={closeAddMenu}
        />
      ) : null}
      {parentMenuAnchor != null ? (
        <CourseSceneParentMenu
          scene={scene}
          clientX={parentMenuAnchor.clientX}
          clientY={parentMenuAnchor.clientY}
          selectedNodeIds={selectedNodeIds}
          activeNodeId={activeNodeId}
          onParentToActive={(mode) => parentSelectedToActive(documentId, mode)}
          onClose={closeParentMenu}
        />
      ) : null}
      {clearParentMenuAnchor != null ? (
        <CourseSceneClearParentMenu
          scene={scene}
          clientX={clearParentMenuAnchor.clientX}
          clientY={clearParentMenuAnchor.clientY}
          selectedNodeIds={selectedNodeIds}
          onClearParent={(mode) => clearParentForSelected(documentId, mode)}
          onClose={closeClearParentMenu}
        />
      ) : null}
      {embedInspector ? (
        <CourseSceneNodeInspector documentId={documentId} scene={scene} />
      ) : null}
    </div>
  );
}
