import { CourseScene3dDebugHud } from "./CourseScene3dDebugHud";
import { Diagram3dSceneDebugHelpers } from "./Diagram3dSceneDebugHelpers";
import {
  Diagram3dDevSceneMarker,
  Diagram3dSceneDebugProbe,
} from "./Diagram3dSceneDebugProbe";
import { isCourseScene3dDebugHudEnabled } from "./courseScene3dDebug";

/** Optional dev-only R3F extras — kept out of the production viewport path. */
export function CourseScene3dDevSceneExtras({
  sceneId,
  modelCount,
  rootCount,
  projection,
  designTime,
}: {
  sceneId: string;
  modelCount: number;
  rootCount: number;
  projection: string;
  designTime: boolean;
}) {
  if (!import.meta.env.DEV) {
    return null;
  }

  const hudEnabled = isCourseScene3dDebugHudEnabled();

  return (
    <>
      {hudEnabled ? <Diagram3dSceneDebugHelpers /> : null}
      <Diagram3dDevSceneMarker />
      {hudEnabled ? (
        <Diagram3dSceneDebugProbe
          sceneId={sceneId}
          modelCount={modelCount}
          rootCount={rootCount}
          projection={projection}
          designTime={designTime}
        />
      ) : null}
    </>
  );
}

export function CourseScene3dDevHudOverlay({ sceneId }: { sceneId: string }) {
  if (!isCourseScene3dDebugHudEnabled()) {
    return null;
  }
  return <CourseScene3dDebugHud sceneId={sceneId} />;
}

export { isCourseScene3dDebugHudEnabled };
