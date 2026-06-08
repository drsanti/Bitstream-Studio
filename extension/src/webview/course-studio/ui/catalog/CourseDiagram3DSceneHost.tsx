import { lazy, Suspense, type ComponentType } from "react";
import type { Course3dSceneId } from "../../schemas/course3dScene";

type SceneHostProps = { className?: string };

const LazyBmiPcbOrientation = lazy(async () => {
  const mod = await import("../../../presentation/widgets/r3f/BmiPcbOrientationScene");
  const Scene: ComponentType<SceneHostProps> = ({ className }) => (
    <mod.BmiPcbOrientationScene framed={false} className={className ?? "h-full min-h-0"} />
  );
  return { default: Scene };
});

const LazyAxisTriad = lazy(async () => {
  const mod = await import("../../../presentation/widgets/r3f/AxisTriad3DScene");
  const Scene: ComponentType<SceneHostProps> = ({ className }) => (
    <mod.AxisTriad3DScene className={className ?? "h-full min-h-0"} />
  );
  return { default: Scene };
});

const LazyBmiGyroGimbal = lazy(async () => {
  const mod = await import("../../../presentation/widgets/r3f/BmiGyroGimbalScene");
  const Scene: ComponentType<SceneHostProps> = ({ className }) => (
    <mod.BmiGyroGimbalScene framed={false} className={className ?? "h-full min-h-0"} />
  );
  return { default: Scene };
});

const SCENE_HOSTS: Record<Course3dSceneId, ComponentType<SceneHostProps>> = {
  "bmi-pcb-orientation": LazyBmiPcbOrientation,
  "axis-triad": LazyAxisTriad,
  "bmi-gyro-gimbal": LazyBmiGyroGimbal,
};

function SceneLoadingFallback() {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center text-2xs text-[var(--text-muted)]">
      Loading 3D scene…
    </div>
  );
}

export function CourseDiagram3DSceneHost({
  sceneId,
  className,
}: {
  sceneId: Course3dSceneId;
  className?: string;
}) {
  const Scene = SCENE_HOSTS[sceneId];
  return (
    <Suspense fallback={<SceneLoadingFallback />}>
      <Scene className={className} />
    </Suspense>
  );
}
