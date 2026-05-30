import { useHelper } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Project4TwinLightEntry } from "../../settings/project4-graphics.types";
import { useProject4GraphicsStore } from "../../settings/project4-graphics.store";

function TwinAmbientLight(props: { entry: Project4TwinLightEntry }) {
  const { entry } = props;
  return <ambientLight color={entry.color} intensity={entry.intensity} />;
}

function TwinDirectionalLight(props: { entry: Project4TwinLightEntry }) {
  const { entry } = props;
  const ref = useRef<THREE.DirectionalLight>(null);
  useHelper(entry.helperVisible ? ref : false, THREE.DirectionalLightHelper, 1);

  useLayoutEffect(() => {
    const light = ref.current;
    if (light == null || !entry.castShadow) {
      return;
    }
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.bias = -0.0002;
    light.shadow.normalBias = 0.025;
    const cam = light.shadow.camera as THREE.OrthographicCamera;
    cam.near = 0.35;
    cam.far = 52;
    cam.left = -14;
    cam.right = 14;
    cam.top = 14;
    cam.bottom = -14;
    cam.updateProjectionMatrix();
  }, [entry.castShadow, entry.id]);

  return (
    <directionalLight
      ref={ref}
      position={entry.position}
      color={entry.color}
      intensity={entry.intensity}
      castShadow={entry.castShadow}
    />
  );
}

function TwinPointLight(props: { entry: Project4TwinLightEntry }) {
  const { entry } = props;
  const ref = useRef<THREE.PointLight>(null);
  useHelper(entry.helperVisible ? ref : false, THREE.PointLightHelper, 0.45);
  return (
    <pointLight
      ref={ref}
      position={entry.position}
      color={entry.color}
      intensity={entry.intensity}
      distance={entry.distance > 0 ? entry.distance : 0}
      decay={entry.decay}
      castShadow={entry.castShadow}
    />
  );
}

function TwinSpotLight(props: { entry: Project4TwinLightEntry }) {
  const { entry } = props;
  const ref = useRef<THREE.SpotLight>(null);
  useHelper(entry.helperVisible ? ref : false, THREE.SpotLightHelper);
  const angleRad = useMemo(() => THREE.MathUtils.degToRad(entry.angleDeg), [entry.angleDeg]);
  return (
    <spotLight
      ref={ref}
      position={entry.position}
      color={entry.color}
      intensity={entry.intensity}
      distance={entry.distance > 0 ? entry.distance : 0}
      decay={entry.decay}
      angle={angleRad}
      penumbra={entry.penumbra}
      castShadow={entry.castShadow}
    />
  );
}

function TwinHemisphereLight(props: { entry: Project4TwinLightEntry }) {
  const { entry } = props;
  const ref = useRef<THREE.HemisphereLight>(null);
  useHelper(entry.helperVisible ? ref : false, THREE.HemisphereLightHelper, 1);
  return (
    <hemisphereLight
      ref={ref}
      position={entry.position}
      color={entry.color}
      groundColor={entry.groundColor}
      intensity={entry.intensity}
    />
  );
}

function TwinLightItem(props: { entry: Project4TwinLightEntry }) {
  const { entry } = props;
  switch (entry.kind) {
    case "ambient":
      return <TwinAmbientLight entry={entry} />;
    case "directional":
      return <TwinDirectionalLight entry={entry} />;
    case "point":
      return <TwinPointLight entry={entry} />;
    case "spot":
      return <TwinSpotLight entry={entry} />;
    case "hemisphere":
      return <TwinHemisphereLight entry={entry} />;
    default:
      return null;
  }
}

/** Lights + optional helpers from **`ternion.project4.graphics.v1`**. */
export function Project4TwinDynamicLights() {
  const lights = useProject4GraphicsStore((s) => s.lights);
  return (
    <>
      {lights.map((entry) => (
        <TwinLightItem key={entry.id} entry={entry} />
      ))}
    </>
  );
}
