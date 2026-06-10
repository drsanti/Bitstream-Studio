import { Canvas } from "@react-three/fiber";
import { Suspense, type ReactNode } from "react";
import { applyCourseScene3dRendererDefaults } from "./courseScene3dGl";

/**
 * Canonical Course Studio 3D viewport shell.
 * Layout + GL bootstrap match the working `RotationPreviewViewport` pattern.
 */
export function CourseScene3dViewport({
  diagramKey,
  cameraPosition,
  cameraFov = 45,
  className,
  inactive = false,
  dataDiagramLink,
  children,
  overlay,
}: {
  diagramKey: string;
  cameraPosition: [number, number, number];
  cameraFov?: number;
  className?: string;
  inactive?: boolean;
  dataDiagramLink?: "live" | "stale";
  children: ReactNode;
  /** HTML overlay (debug HUD, status chips stay outside). */
  overlay?: ReactNode;
}) {
  return (
    <div
      className={`course-scene-3d-viewport relative flex h-full min-h-[180px] min-w-0 w-full flex-col overflow-hidden bg-[var(--scene-bg)] ${
        inactive ? "course-diagram-3d-layer--inactive" : ""
      } ${className ?? ""}`}
      data-diagram-link={dataDiagramLink}
    >
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Canvas
          key={diagramKey}
          camera={{ position: cameraPosition, fov: cameraFov }}
          className="course-scene-3d-viewport__canvas h-full w-full"
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
          frameloop="always"
          onCreated={({ gl }) => {
            applyCourseScene3dRendererDefaults(gl);
          }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      </div>
      {overlay}
    </div>
  );
}
