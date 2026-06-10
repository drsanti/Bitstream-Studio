import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PresentationOrbitControls } from "../../../presentation/widgets/r3f/PresentationOrbitControls";
import { readDiagram3dCamera } from "./diagram3dCamera";
import { Diagram3dCameraBootstrap } from "./Diagram3dCameraBootstrap";
import { Diagram3dOrbitControls } from "./Diagram3dOrbitControls";
import { Diagram3dViewportControlsProvider } from "./diagram3dViewportControlsContext";
import { PresentationStage } from "../../../presentation/widgets/r3f/PresentationStage";
import { CourseSceneStage } from "../scene/CourseSceneStage";
import type { SceneEnvironmentSettingsV1 } from "../../schemas/scene.v1";
import type { StudioViewportViewSnapId } from "../../../sensor-studio/core/viewport/studio-viewport-view-snaps";
import { DEFAULT_LINK_HEALTH_POLICY } from "../../schemas/linkHealth";
import type { DiagramV1 } from "../../schemas/diagram.v1";
import type { LinkHealthPolicy } from "../../schemas/linkHealth";
import { getDiagram3dLayer } from "../../schemas/normalizeDiagramV1";
import { findDiagram3dNode } from "./diagram3dNodeMutations";
import { useCourseTelemetryLinkState } from "../useCourseTelemetryLinkState";
import { DIAGRAM_DESIGN_TIME_SNAPSHOT } from "./diagramDesignTimeSnapshot";
import { Diagram3dModelMesh } from "./Diagram3dModelMesh";
import { Diagram3dTransformGizmo } from "./Diagram3dTransformGizmo";
import type { Diagram3dTransformGizmoMode } from "./diagram3dGizmoHelpers";
import { canDiagram3dNodeUseRotateGizmo } from "./diagram3dGizmoHelpers";
import { applyResolvedRotationToObject3D } from "./diagram3dTransform";
import {
  countResolvedDiagram3dModels,
  evaluateDiagram3dProps,
  type ResolvedDiagram3dTreeNode,
  type ResolvedModel3dProps,
  type ResolvedRotation3d,
} from "./evaluateDiagram3dProps";
import { resolveDiagramRenderSnapshot } from "./diagramLinkHealth";
import {
  CourseScene3dDevHudOverlay,
  CourseScene3dDevSceneExtras,
} from "../scene/CourseScene3dDevKit";
import { CourseScene3dViewport } from "../scene/CourseScene3dViewport";
import {
  isDiagram3dGizmoTarget,
  isSceneNodeSelected,
  resolveSceneSelectionIds,
} from "../scene/courseSceneSelection";
import type { Scene3dSelectionAppearancePrefs } from "./diagram3dSelectionAppearance";
import {
  proceduralEmissiveBoostForRole,
  resolveScene3dHighlightStyleForNode,
  resolveScene3dNodeHighlightRole,
  resolveScene3dRoleAppearance,
  shouldShowScene3dGroupOutline,
} from "./diagram3dSelectionAppearance";
import { Diagram3dNodeHighlightShell } from "./Diagram3dNodeHighlight";
import { useCourseDiagram3dViewportPrefs } from "../../maintainer/useCourseDiagram3dViewportPrefs";
import { Diagram3dBoxSelectBridge, type Diagram3dBoxSelectProjector } from "./Diagram3dBoxSelectBridge";
import { Diagram3dMultiSelectionGizmo } from "./Diagram3dMultiSelectionGizmo";
import {
  Diagram3dMultiGizmoPreviewProvider,
  Diagram3dMultiGizmoPreviewReset,
  useDiagram3dGizmoInteraction,
} from "./diagram3dMultiGizmoPreviewContext";
import {
  resolvedRotationToR3fProps,
  sanitizeDiagram3dPosition,
  sanitizeDiagram3dScale,
} from "./diagram3dResolvedTransformProps";
import { applyPreviewWorldMatrixToGroup } from "../scene/scene3dSelectionPivot";
import type { SceneV1 } from "../../schemas/scene.v1";
import type { Matrix4 } from "three";

type TransformSkipFlags = {
  position: boolean;
  rotation: boolean;
  scale: boolean;
};

function applyResolvedTransformToGroup(
  group: THREE.Group,
  position: [number, number, number],
  rotation: ResolvedRotation3d,
  scale: [number, number, number],
  skip: TransformSkipFlags,
): void {
  if (!skip.position) {
    group.position.set(
      Number.isFinite(position[0]) ? position[0] : 0,
      Number.isFinite(position[1]) ? position[1] : 0,
      Number.isFinite(position[2]) ? position[2] : 0,
    );
  }
  if (!skip.scale) {
    group.scale.set(
      Number.isFinite(scale[0]) && scale[0] !== 0 ? scale[0] : 1,
      Number.isFinite(scale[1]) && scale[1] !== 0 ? scale[1] : 1,
      Number.isFinite(scale[2]) && scale[2] !== 0 ? scale[2] : 1,
    );
  }
  if (!skip.rotation) {
    applyResolvedRotationToObject3D(group, rotation);
  }
}

function gizmoSkipFlags(
  gizmoMode: Diagram3dTransformGizmoMode,
): TransformSkipFlags {
  return {
    position: gizmoMode === "translate",
    rotation: gizmoMode === "rotate",
    scale: gizmoMode === "scale",
  };
}

function resolveNodeTransformSkip(
  designTime: boolean,
  gizmoTarget: boolean,
  multiSelected: boolean,
  gizmoMode: Diagram3dTransformGizmoMode | undefined,
  singleDragging: boolean,
): TransformSkipFlags {
  if (
    !designTime ||
    gizmoMode == null ||
    multiSelected ||
    !gizmoTarget ||
    !singleDragging
  ) {
    return { position: false, rotation: false, scale: false };
  }
  return gizmoSkipFlags(gizmoMode);
}

function buildDeclarativeNodeTransform(
  position: [number, number, number],
  rotation: ResolvedRotation3d,
  scale: [number, number, number],
): {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  quaternion?: [number, number, number, number];
} {
  return {
    position: sanitizeDiagram3dPosition(position),
    scale: sanitizeDiagram3dScale(scale),
    ...resolvedRotationToR3fProps(rotation),
  };
}

function multiSelectionRotateAllowed(
  diagram: DiagramV1,
  selectionIds: readonly string[],
): boolean {
  if (selectionIds.length === 0) {
    return false;
  }
  for (const nodeId of selectionIds) {
    const node = findDiagram3dNode(diagram, nodeId);
    if (node == null || !canDiagram3dNodeUseRotateGizmo(node.rotation)) {
      return false;
    }
  }
  return true;
}

function Diagram3dSelectionGizmo({
  targetRef,
  gizmoMode,
  rotateAllowed,
  onPointerDown,
  onDragStart,
  onPositionCommit,
  onRotationCommit,
  onScaleCommit,
}: {
  targetRef: RefObject<THREE.Group | null>;
  gizmoMode: Diagram3dTransformGizmoMode;
  rotateAllowed: boolean;
  onPointerDown?: () => void;
  onDragStart?: () => void;
  onPositionCommit?: (position: [number, number, number]) => void;
  onRotationCommit?: (eulerDegrees: [number, number, number]) => void;
  onScaleCommit?: (scale: [number, number, number]) => void;
}) {
  if (gizmoMode === "rotate" && !rotateAllowed) {
    return null;
  }

  return (
    <Diagram3dTransformGizmo
      targetRef={targetRef}
      mode={gizmoMode}
      onPointerDown={onPointerDown}
      onDragStart={onDragStart}
      onPositionCommit={onPositionCommit}
      onRotationCommit={onRotationCommit}
      onScaleCommit={onScaleCommit}
    />
  );
}

function Diagram3dModelNode({
  resolved,
  selected = false,
  gizmoTarget = false,
  designTime = false,
  parentVisible = true,
  gizmoMode,
  rotateAllowed,
  selectionAppearance,
  selectionIds,
  activeModelId,
  onSelect,
  onNodePointerDown,
  onGizmoPointerDown,
  onGizmoDragStart,
  onPositionCommit,
  onRotationCommit,
  onScaleCommit,
}: {
  resolved: ResolvedModel3dProps;
  selected?: boolean;
  gizmoTarget?: boolean;
  designTime?: boolean;
  parentVisible?: boolean;
  gizmoMode?: Diagram3dTransformGizmoMode;
  rotateAllowed?: boolean;
  selectionAppearance?: Scene3dSelectionAppearancePrefs;
  selectionIds?: readonly string[];
  activeModelId?: string | null;
  onSelect?: (nodeId: string, extend?: boolean) => void;
  onNodePointerDown?: () => void;
  onGizmoPointerDown?: () => void;
  onGizmoDragStart?: () => void;
  onPositionCommit?: (nodeId: string, position: [number, number, number]) => void;
  onRotationCommit?: (nodeId: string, eulerDegrees: [number, number, number]) => void;
  onScaleCommit?: (nodeId: string, scale: [number, number, number]) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;
  const visible = parentVisible && resolved.visible;
  const multiSelected = (selectionIds?.length ?? 0) > 1;
  const gizmoInteraction = useDiagram3dGizmoInteraction();
  const multiDragging = gizmoInteraction?.multiGizmoDragging ?? false;
  const singleDragging = gizmoInteraction?.singleGizmoDragging ?? false;
  const manualTransform =
    multiDragging ||
    (designTime && gizmoTarget && !multiSelected && singleDragging && gizmoMode != null);
  const declarativeTransform = manualTransform
    ? {}
    : buildDeclarativeNodeTransform(
        resolved.position,
        resolved.rotation,
        resolved.scale,
      );

  useFrame(() => {
    const group = groupRef.current;
    const current = resolvedRef.current;
    if (group == null || !visible || !manualTransform) {
      return;
    }
    const previewMatrix = multiDragging
      ? gizmoInteraction?.previewWorldMatricesRef.current?.[current.id]
      : undefined;
    if (previewMatrix != null) {
      applyPreviewWorldMatrixToGroup(group, previewMatrix);
      return;
    }
    applyResolvedTransformToGroup(
      group,
      current.position,
      current.rotation,
      current.scale,
      resolveNodeTransformSkip(
        designTime,
        gizmoTarget,
        multiSelected,
        gizmoMode,
        singleDragging,
      ),
    );
    // Priority must stay <= 0: any positive useFrame priority switches R3F to
    // manual rendering (gl.render is never called) and the canvas stays black.
  }, 0);

  if (!visible) {
    return null;
  }

  const showGizmo =
    designTime &&
    gizmoTarget &&
    !multiSelected &&
    gizmoMode != null &&
    (onPositionCommit != null || onRotationCommit != null || onScaleCommit != null);

  const highlightRole =
    designTime && selectionAppearance != null && selectionIds != null
      ? resolveScene3dNodeHighlightRole(resolved.id, selectionIds, activeModelId ?? null)
      : "none";
  const roleAppearance =
    selectionAppearance != null
      ? resolveScene3dRoleAppearance(selectionAppearance, highlightRole)
      : null;
  const emissiveBoost =
    selectionAppearance != null
      ? proceduralEmissiveBoostForRole(selectionAppearance, highlightRole)
      : selected || gizmoTarget
        ? 0.22
        : 0;

  const mesh = (
    <Diagram3dModelMesh
      modelId={resolved.modelId}
      opacity={resolved.opacity}
      highlightRole={highlightRole}
      emissiveBoost={emissiveBoost}
      material={resolved.material}
      animationClip={resolved.animationClip}
      animationLoop={resolved.animationLoop}
      animationPlaying={resolved.animationPlaying}
    />
  );

  return (
    <>
      <group
        ref={groupRef}
        {...declarativeTransform}
        onPointerDown={
          onNodePointerDown != null
            ? (event) => {
                event.stopPropagation();
                onNodePointerDown();
              }
            : undefined
        }
        onClick={
          onSelect != null
            ? (event) => {
                event.stopPropagation();
                onSelect(resolved.id, event.shiftKey);
              }
            : undefined
        }
      >
        {roleAppearance != null && selectionAppearance != null ? (
          <Diagram3dNodeHighlightShell
            targetRef={groupRef}
            highlightStyle={resolveScene3dHighlightStyleForNode(selectionAppearance, "model")}
            appearance={roleAppearance}
          >
            {mesh}
          </Diagram3dNodeHighlightShell>
        ) : (
          mesh
        )}
      </group>
      {showGizmo ? (
        <Diagram3dSelectionGizmo
          targetRef={groupRef}
          gizmoMode={gizmoMode}
          rotateAllowed={rotateAllowed ?? false}
          onPointerDown={onGizmoPointerDown}
          onDragStart={onGizmoDragStart}
          onPositionCommit={
            onPositionCommit != null
              ? (position) => onPositionCommit(resolved.id, position)
              : undefined
          }
          onRotationCommit={
            onRotationCommit != null
              ? (eulerDegrees) => onRotationCommit(resolved.id, eulerDegrees)
              : undefined
          }
          onScaleCommit={
            onScaleCommit != null ? (scale) => onScaleCommit(resolved.id, scale) : undefined
          }
        />
      ) : null}
    </>
  );
}

function Diagram3dGroupNode({
  node,
  diagram,
  designTime = false,
  parentVisible = true,
  selectionIds,
  activeModelId,
  gizmoMode,
  selectionAppearance,
  onSelectModelId,
  onNodePointerDown,
  onGizmoPointerDown,
  onGizmoDragStart,
  onNodePositionCommit,
  onNodeRotationCommit,
  onNodeScaleCommit,
}: {
  node: Extract<ResolvedDiagram3dTreeNode, { type: "group3d" }>;
  diagram: DiagramV1;
  designTime?: boolean;
  parentVisible?: boolean;
  selectionIds: string[];
  activeModelId?: string | null;
  gizmoMode?: Diagram3dTransformGizmoMode;
  selectionAppearance?: Scene3dSelectionAppearancePrefs;
  onSelectModelId?: (nodeId: string, extend?: boolean) => void;
  onNodePointerDown?: () => void;
  onGizmoPointerDown?: () => void;
  onGizmoDragStart?: () => void;
  onNodePositionCommit?: (nodeId: string, position: [number, number, number]) => void;
  onNodeRotationCommit?: (nodeId: string, eulerDegrees: [number, number, number]) => void;
  onNodeScaleCommit?: (nodeId: string, scale: [number, number, number]) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRef = useRef(node);
  nodeRef.current = node;
  const visible = parentVisible && node.visible;
  const multiSelected = selectionIds.length > 1;
  const gizmoTarget = isDiagram3dGizmoTarget(node.id, activeModelId);
  const gizmoInteraction = useDiagram3dGizmoInteraction();
  const multiDragging = gizmoInteraction?.multiGizmoDragging ?? false;
  const singleDragging = gizmoInteraction?.singleGizmoDragging ?? false;
  const manualTransform =
    multiDragging ||
    (designTime && gizmoTarget && !multiSelected && singleDragging && gizmoMode != null);
  const declarativeTransform = manualTransform
    ? {}
    : buildDeclarativeNodeTransform(node.position, node.rotation, node.scale);
  const sourceNode = findDiagram3dNode(diagram, node.id);
  const rotateAllowed =
    sourceNode != null && canDiagram3dNodeUseRotateGizmo(sourceNode.rotation);

  useFrame(() => {
    const group = groupRef.current;
    const current = nodeRef.current;
    if (group == null || !visible || !manualTransform) {
      return;
    }
    const previewMatrix = multiDragging
      ? gizmoInteraction?.previewWorldMatricesRef.current?.[current.id]
      : undefined;
    if (previewMatrix != null) {
      applyPreviewWorldMatrixToGroup(group, previewMatrix);
      return;
    }
    applyResolvedTransformToGroup(
      group,
      current.position,
      current.rotation,
      current.scale,
      resolveNodeTransformSkip(
        designTime,
        gizmoTarget,
        multiSelected,
        gizmoMode,
        singleDragging,
      ),
    );
    // Priority must stay <= 0 — see Diagram3dModelNode note (positive priority kills auto-render).
  }, 0);

  if (!visible) {
    return null;
  }

  const showGizmo =
    designTime &&
    gizmoTarget &&
    !multiSelected &&
    gizmoMode != null &&
    (onNodePositionCommit != null ||
      onNodeRotationCommit != null ||
      onNodeScaleCommit != null);

  const highlightRole =
    designTime && selectionAppearance != null
      ? resolveScene3dNodeHighlightRole(node.id, selectionIds, activeModelId ?? null)
      : "none";
  const roleAppearance =
    selectionAppearance != null &&
    shouldShowScene3dGroupOutline("group3d", highlightRole, selectionAppearance.showGroupOutlines)
      ? resolveScene3dRoleAppearance(selectionAppearance, highlightRole)
      : null;

  const childTree = node.children.map((child) => (
    <Diagram3dTreeNode
      key={child.id}
      node={child}
      diagram={diagram}
      designTime={designTime}
      parentVisible={visible}
      selectionIds={selectionIds}
      activeModelId={activeModelId}
      gizmoMode={gizmoMode}
      selectionAppearance={selectionAppearance}
      onSelectModelId={onSelectModelId}
      onNodePointerDown={onNodePointerDown}
      onGizmoPointerDown={onGizmoPointerDown}
      onGizmoDragStart={onGizmoDragStart}
      onNodePositionCommit={onNodePositionCommit}
      onNodeRotationCommit={onNodeRotationCommit}
      onNodeScaleCommit={onNodeScaleCommit}
    />
  ));

  return (
    <>
      <group
        ref={groupRef}
        {...declarativeTransform}
        onPointerDown={
          onNodePointerDown != null
            ? (event) => {
                event.stopPropagation();
                onNodePointerDown();
              }
            : undefined
        }
        onClick={
          onSelectModelId != null
            ? (event) => {
                event.stopPropagation();
                onSelectModelId(node.id, event.shiftKey);
              }
            : undefined
        }
      >
        {roleAppearance != null && selectionAppearance != null ? (
          <Diagram3dNodeHighlightShell
            targetRef={groupRef}
            highlightStyle={resolveScene3dHighlightStyleForNode(selectionAppearance, "group3d")}
            appearance={roleAppearance}
          >
            <group>{childTree}</group>
          </Diagram3dNodeHighlightShell>
        ) : (
          childTree
        )}
      </group>
      {showGizmo ? (
        <Diagram3dSelectionGizmo
          targetRef={groupRef}
          gizmoMode={gizmoMode!}
          rotateAllowed={rotateAllowed}
          onPointerDown={onGizmoPointerDown}
          onDragStart={onGizmoDragStart}
          onPositionCommit={
            onNodePositionCommit != null
              ? (position) => onNodePositionCommit(node.id, position)
              : undefined
          }
          onRotationCommit={
            onNodeRotationCommit != null
              ? (eulerDegrees) => onNodeRotationCommit(node.id, eulerDegrees)
              : undefined
          }
          onScaleCommit={
            onNodeScaleCommit != null ? (scale) => onNodeScaleCommit(node.id, scale) : undefined
          }
        />
      ) : null}
    </>
  );
}

function Diagram3dTreeNode({
  node,
  diagram,
  designTime = false,
  parentVisible = true,
  selectionIds,
  activeModelId,
  gizmoMode,
  selectionAppearance,
  onSelectModelId,
  onNodePointerDown,
  onGizmoPointerDown,
  onGizmoDragStart,
  onNodePositionCommit,
  onNodeRotationCommit,
  onNodeScaleCommit,
}: {
  node: ResolvedDiagram3dTreeNode;
  diagram: DiagramV1;
  designTime?: boolean;
  parentVisible?: boolean;
  selectionIds: string[];
  activeModelId?: string | null;
  gizmoMode?: Diagram3dTransformGizmoMode;
  selectionAppearance?: Scene3dSelectionAppearancePrefs;
  onSelectModelId?: (nodeId: string, extend?: boolean) => void;
  onNodePointerDown?: () => void;
  onGizmoPointerDown?: () => void;
  onGizmoDragStart?: () => void;
  onNodePositionCommit?: (nodeId: string, position: [number, number, number]) => void;
  onNodeRotationCommit?: (nodeId: string, eulerDegrees: [number, number, number]) => void;
  onNodeScaleCommit?: (nodeId: string, scale: [number, number, number]) => void;
}) {
  if (node.type === "model") {
    const sourceNode = findDiagram3dNode(diagram, node.id);
    return (
      <Diagram3dModelNode
        resolved={node}
        designTime={designTime}
        parentVisible={parentVisible}
        selected={isSceneNodeSelected(selectionIds, node.id)}
        gizmoTarget={isDiagram3dGizmoTarget(node.id, activeModelId)}
        gizmoMode={gizmoMode}
        rotateAllowed={
          sourceNode != null && canDiagram3dNodeUseRotateGizmo(sourceNode.rotation)
        }
        selectionAppearance={selectionAppearance}
        selectionIds={selectionIds}
        activeModelId={activeModelId}
        onSelect={onSelectModelId}
        onNodePointerDown={onNodePointerDown}
        onGizmoPointerDown={onGizmoPointerDown}
        onGizmoDragStart={onGizmoDragStart}
        onPositionCommit={onNodePositionCommit}
        onRotationCommit={onNodeRotationCommit}
        onScaleCommit={onNodeScaleCommit}
      />
    );
  }

  return (
    <Diagram3dGroupNode
      node={node}
      diagram={diagram}
      designTime={designTime}
      parentVisible={parentVisible}
      selectionIds={selectionIds}
      activeModelId={activeModelId}
      gizmoMode={gizmoMode}
      selectionAppearance={selectionAppearance}
      onSelectModelId={onSelectModelId}
      onNodePointerDown={onNodePointerDown}
      onGizmoPointerDown={onGizmoPointerDown}
      onGizmoDragStart={onGizmoDragStart}
      onNodePositionCommit={onNodePositionCommit}
      onNodeRotationCommit={onNodeRotationCommit}
      onNodeScaleCommit={onNodeScaleCommit}
    />
  );
}

function Diagram3dSceneContent({
  diagram,
  scene,
  roots,
  designTime = false,
  selectedModelIds,
  activeModelId,
  selectedModelId,
  gizmoMode,
  selectionAppearance,
  cameraPosition,
  cameraFov = 45,
  cameraResetNonce,
  captureViewNonce,
  viewSnapNonce,
  viewSnapId,
  onCaptureCameraView,
  onSelectModelId,
  onNodePointerDown,
  onGizmoPointerDown,
  onGizmoDragStart,
  onMultiGizmoDragStart,
  onMultiGizmoCommit,
  onRegisterBoxSelectProjector,
  onNodePositionCommit,
  onNodeRotationCommit,
  onNodeScaleCommit,
  environmentSettings,
}: {
  diagram: DiagramV1;
  scene?: SceneV1;
  roots: ResolvedDiagram3dTreeNode[];
  designTime?: boolean;
  selectedModelIds?: string[];
  activeModelId?: string | null;
  selectedModelId?: string | null;
  gizmoMode?: Diagram3dTransformGizmoMode;
  selectionAppearance?: Scene3dSelectionAppearancePrefs;
  cameraPosition: [number, number, number];
  cameraFov?: number;
  cameraResetNonce?: number;
  captureViewNonce?: number;
  viewSnapNonce?: number;
  viewSnapId?: StudioViewportViewSnapId;
  onCaptureCameraView?: (position: [number, number, number]) => void;
  onSelectModelId?: (nodeId: string, extend?: boolean) => void;
  onNodePointerDown?: () => void;
  onGizmoPointerDown?: () => void;
  onGizmoDragStart?: () => void;
  onMultiGizmoDragStart?: () => void;
  onMultiGizmoCommit?: (pivotStartWorld: Matrix4, pivotEndWorld: Matrix4) => void;
  onRegisterBoxSelectProjector?: (projector: Diagram3dBoxSelectProjector | null) => void;
  onNodePositionCommit?: (nodeId: string, position: [number, number, number]) => void;
  onNodeRotationCommit?: (nodeId: string, eulerDegrees: [number, number, number]) => void;
  onNodeScaleCommit?: (nodeId: string, scale: [number, number, number]) => void;
  environmentSettings?: SceneEnvironmentSettingsV1;
}) {
  const selectionIds = resolveSceneSelectionIds(selectedModelIds, selectedModelId);
  const resolvedActive =
    activeModelId ?? selectedModelId ?? selectionIds[selectionIds.length - 1] ?? null;

  const selectionKey = `${selectionIds.join("|")}:${resolvedActive ?? ""}`;

  return (
    <>
      <Diagram3dCameraBootstrap position={cameraPosition} fov={cameraFov} />
      {designTime ? (
        <Diagram3dMultiGizmoPreviewReset selectionKey={selectionKey} />
      ) : null}
      {designTime ? (
        <Diagram3dOrbitControls
          cameraPosition={cameraPosition}
          cameraFov={cameraFov}
          resetNonce={cameraResetNonce}
          captureViewNonce={captureViewNonce}
          viewSnapNonce={viewSnapNonce}
          viewSnapId={viewSnapId}
          onCaptureView={onCaptureCameraView}
        />
      ) : (
        <PresentationOrbitControls />
      )}
      {environmentSettings != null ? (
        <CourseSceneStage settings={environmentSettings} />
      ) : (
        <PresentationStage />
      )}
      {designTime && onRegisterBoxSelectProjector != null ? (
        <Diagram3dBoxSelectBridge
          diagram={diagram}
          onRegisterProjector={onRegisterBoxSelectProjector}
        />
      ) : null}
      {designTime &&
      scene != null &&
      selectionIds.length > 1 &&
      gizmoMode != null &&
      onMultiGizmoCommit != null ? (
        <Diagram3dMultiSelectionGizmo
          scene={scene}
          selectionIds={selectionIds}
          activeNodeId={resolvedActive}
          gizmoMode={gizmoMode}
          rotateAllowed={multiSelectionRotateAllowed(diagram, selectionIds)}
          onDragStart={onMultiGizmoDragStart}
          onPointerDown={onGizmoPointerDown}
          onCommit={onMultiGizmoCommit}
        />
      ) : null}
      {roots.map((node) => (
        <Diagram3dTreeNode
          key={node.id}
          node={node}
          diagram={diagram}
          designTime={designTime}
          selectionIds={selectionIds}
          activeModelId={resolvedActive}
          gizmoMode={gizmoMode}
          selectionAppearance={selectionAppearance}
          onSelectModelId={onSelectModelId}
          onNodePointerDown={onNodePointerDown}
          onGizmoPointerDown={onGizmoPointerDown}
          onGizmoDragStart={onGizmoDragStart}
          onNodePositionCommit={onNodePositionCommit}
          onNodeRotationCommit={onNodeRotationCommit}
          onNodeScaleCommit={onNodeScaleCommit}
        />
      ))}
    </>
  );
}

export function CourseDiagram3DLayer({
  diagram,
  scene,
  pageLinkHealth,
  pageStaleMs,
  designTime = false,
  className,
  selectedModelIds,
  activeModelId,
  selectedModelId,
  gizmoMode,
  cameraResetNonce,
  captureViewNonce,
  viewSnapNonce,
  viewSnapId,
  onCaptureCameraView,
  onSelectModelId,
  onNodePointerDown,
  onGizmoPointerDown,
  onGizmoDragStart,
  onMultiGizmoDragStart,
  onMultiGizmoCommit,
  onRegisterBoxSelectProjector,
  onNodePositionCommit,
  onNodeRotationCommit,
  onNodeScaleCommit,
  environmentSettings,
}: {
  diagram: DiagramV1;
  scene?: SceneV1;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
  designTime?: boolean;
  className?: string;
  selectedModelIds?: string[];
  activeModelId?: string | null;
  selectedModelId?: string | null;
  gizmoMode?: Diagram3dTransformGizmoMode;
  cameraResetNonce?: number;
  captureViewNonce?: number;
  viewSnapNonce?: number;
  viewSnapId?: StudioViewportViewSnapId;
  onCaptureCameraView?: (position: [number, number, number]) => void;
  onSelectModelId?: (nodeId: string, extend?: boolean) => void;
  onNodePointerDown?: () => void;
  onGizmoPointerDown?: () => void;
  onGizmoDragStart?: () => void;
  onMultiGizmoDragStart?: () => void;
  onMultiGizmoCommit?: (pivotStartWorld: Matrix4, pivotEndWorld: Matrix4) => void;
  onRegisterBoxSelectProjector?: (projector: Diagram3dBoxSelectProjector | null) => void;
  onNodePositionCommit?: (nodeId: string, position: [number, number, number]) => void;
  onNodeRotationCommit?: (nodeId: string, eulerDegrees: [number, number, number]) => void;
  onNodeScaleCommit?: (nodeId: string, scale: [number, number, number]) => void;
  environmentSettings?: SceneEnvironmentSettingsV1;
}) {
  const live = useCourseTelemetryLinkState(pageStaleMs);
  const lastGoodRef = useRef(live.snapshot);

  const currentSnapshot = designTime ? null : live.snapshot;
  const healthy = designTime ? false : live.healthy;
  const lastRxAtMs = designTime ? null : live.lastRxAtMs;
  const nowMs = designTime ? Date.now() : live.nowMs;

  useEffect(() => {
    if (designTime || !healthy) {
      return;
    }
    if (currentSnapshot != null) {
      lastGoodRef.current = currentSnapshot;
    }
  }, [currentSnapshot, designTime, healthy]);

  const policy = diagram.linkHealth ?? pageLinkHealth ?? DEFAULT_LINK_HEALTH_POLICY;
  const { snapshot, inactive } = designTime
    ? {
        snapshot: DIAGRAM_DESIGN_TIME_SNAPSHOT,
        inactive: false,
      }
    : resolveDiagramRenderSnapshot({
        current: currentSnapshot!,
        lastGood: lastGoodRef.current,
        policy,
        freshness: {
          nowMs,
          lastRxAtMs,
          staleMs: pageStaleMs,
        },
      });

  const resolved = useMemo(
    () => evaluateDiagram3dProps(diagram, snapshot),
    [diagram, snapshot],
  );

  const modelCount = useMemo(
    () => countResolvedDiagram3dModels(resolved.roots),
    [resolved.roots],
  );
  const selectionAppearance = useCourseDiagram3dViewportPrefs((s) => s.selectionAppearance);
  const projection = useCourseDiagram3dViewportPrefs((s) => s.projection);
  const resolvedCamera = readDiagram3dCamera(diagram);
  const cameraPosition = resolvedCamera.position;
  const cameraFov = resolvedCamera.fov;

  if (modelCount === 0) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center text-2xs text-[var(--text-muted)]">
        No 3D model nodes
      </div>
    );
  }

  const diagramKey = `${diagram.id}-${designTime ? "edit" : "preview"}`;

  return (
    <CourseScene3dViewport
      diagramKey={diagramKey}
      cameraPosition={cameraPosition}
      cameraFov={cameraFov}
      className={className}
      inactive={inactive}
      dataDiagramLink={inactive ? "stale" : "live"}
      overlay={<CourseScene3dDevHudOverlay sceneId={diagramKey} />}
    >
      <Diagram3dViewportControlsProvider>
        <Diagram3dMultiGizmoPreviewProvider>
          <Diagram3dSceneContent
            diagram={diagram}
            scene={scene}
            roots={resolved.roots}
            designTime={designTime}
            selectedModelIds={selectedModelIds}
            activeModelId={activeModelId}
            selectedModelId={selectedModelId}
            gizmoMode={gizmoMode}
            selectionAppearance={designTime ? selectionAppearance : undefined}
            cameraPosition={cameraPosition}
            cameraFov={cameraFov}
            cameraResetNonce={cameraResetNonce}
            captureViewNonce={captureViewNonce}
            viewSnapNonce={viewSnapNonce}
            viewSnapId={viewSnapId}
            onCaptureCameraView={onCaptureCameraView}
            onSelectModelId={onSelectModelId}
            onNodePointerDown={onNodePointerDown}
            onGizmoPointerDown={onGizmoPointerDown}
            onGizmoDragStart={onGizmoDragStart}
            onMultiGizmoDragStart={onMultiGizmoDragStart}
            onMultiGizmoCommit={onMultiGizmoCommit}
            onRegisterBoxSelectProjector={onRegisterBoxSelectProjector}
            onNodePositionCommit={onNodePositionCommit}
            onNodeRotationCommit={onNodeRotationCommit}
            onNodeScaleCommit={onNodeScaleCommit}
            environmentSettings={environmentSettings}
          />
          <CourseScene3dDevSceneExtras
            sceneId={diagramKey}
            modelCount={modelCount}
            rootCount={resolved.roots.length}
            projection={projection}
            designTime={designTime}
          />
        </Diagram3dMultiGizmoPreviewProvider>
      </Diagram3dViewportControlsProvider>
    </CourseScene3dViewport>
  );
}
