import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getEngineEnvironmentCubeMapPresetAt } from "@/engine-environment/t3dEngineEnvironment";
import { buildCubeMapFaceUrls } from './model-preview-utils';
import { buildGlobalDirectoryFallbackOptions } from '../asset-resolution/global-directory-online-fallback';
import { preflightModelPreviewUrlWithGlobalDirectoryFallback } from '../model-loader/ui/preflightModelPreviewUrl.js';

export interface ThumbnailGeneratorOptions {
  sizePx?: number;
  /** If null, keeps transparent background. */
  backgroundCssColor?: string | null;
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const meshLike = obj as THREE.Mesh;
    if (meshLike.geometry) {
      meshLike.geometry.dispose?.();
    }

    const material = (meshLike as { material?: unknown }).material;
    if (!material) return;

    if (Array.isArray(material)) {
      material.forEach((m) => {
        (m as THREE.Material).dispose?.();
      });
    } else {
      (material as THREE.Material).dispose?.();
    }
  });
}

export async function generateThumbnailDataUrl(
  modelUrl: string,
  options?: ThumbnailGeneratorOptions
): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Thumbnail generation requires a browser-like environment.');
  }

  const sizePx = options?.sizePx ?? 420;
  const backgroundCssColor = options?.backgroundCssColor ?? null;

  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;

  const createRenderer = (antialias: boolean) => {
    return new THREE.WebGLRenderer({
      canvas,
      alpha: backgroundCssColor === null,
      antialias,
      preserveDrawingBuffer: true,
    });
  };

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = createRenderer(true);
  } catch {
    // Some VS Code webviews are more restrictive; fallback to no antialias.
    renderer = createRenderer(false);
  }
  renderer.setPixelRatio(1);
  renderer.setSize(sizePx, sizePx, false);

  if (backgroundCssColor !== null) {
    renderer.setClearColor(new THREE.Color(backgroundCssColor), 1);
  }

  const scene = new THREE.Scene();
  let environmentTexture: THREE.CubeTexture | null = null;

  const loadEnvironmentTexture = async (): Promise<THREE.CubeTexture | null> => {
    const preset = getEngineEnvironmentCubeMapPresetAt(0);
    if (!preset) {
      return null;
    }
    const urls = buildCubeMapFaceUrls(preset.path);
    const loader = new THREE.CubeTextureLoader();
    return new Promise((resolve) => {
      loader.load(
        urls,
        (texture) => resolve(texture),
        undefined,
        () => resolve(null)
      );
    });
  };

  environmentTexture = await loadEnvironmentTexture();
  if (environmentTexture) {
    // Enable PBR reflections to improve thumbnail realism.
    scene.environment = environmentTexture;
    scene.environmentIntensity = 1;
  }

  // Keep the lighting simple and deterministic for thumbnails.
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(2.5, 3.5, 2.0);
  scene.add(dir);

  const pf = await preflightModelPreviewUrlWithGlobalDirectoryFallback(
    modelUrl,
    buildGlobalDirectoryFallbackOptions(modelUrl),
    new AbortController().signal,
  );
  if (!pf.ok) {
    throw new Error(pf.message);
  }
  const validatedUrl = pf.url;

  const gltfLoader = new GLTFLoader();

  const gltf = await gltfLoader.loadAsync(validatedUrl);
  const root = gltf.scene;
  scene.add(root);

  scene.updateMatrixWorld(true);

  // In glTF, camera pose is usually defined by a camera *node* in the scene
  // hierarchy. `gltf.cameras[0]` can exist as a camera object that isn't
  // guaranteed to have the node transform applied the way we'd expect.
  //
  // We'll prefer:
  // 1) the scene-graph node that corresponds to `gltf.cameras[0]` (matching
  //    by reference/uuid)
  // 2) otherwise, the first camera node in the scene graph.
  const gltfCameras = (gltf as { cameras?: THREE.Camera[] }).cameras;
  const desiredCamera = gltfCameras?.[0] ?? null;

  let cameraNode: THREE.Camera | null = null;
  let firstCameraNode: THREE.Camera | null = null;
  root.traverse((obj) => {
    if (obj === null) return;
    const objMaybeCamera = obj as unknown as { isCamera?: boolean };
    if (!objMaybeCamera.isCamera) return;

    const camNode = obj as THREE.Camera;
    if (!firstCameraNode) firstCameraNode = camNode;

    if (
      desiredCamera &&
      (obj === desiredCamera || camNode.uuid === desiredCamera.uuid)
    ) {
      cameraNode = camNode;
    }
  });

  cameraNode = cameraNode ?? firstCameraNode;

  let camera: THREE.PerspectiveCamera;

  if (cameraNode) {
    cameraNode.updateMatrixWorld(true);

    if (cameraNode instanceof THREE.PerspectiveCamera) {
      // Render using the node camera itself so we match its full projection
      // and transform precisely (only force square aspect).
      camera = cameraNode;

      // The original camera pose is authored for some aspect ratio.
      // Our thumbnail viewport is square (aspect=1). If we just override
      // `aspect`, it changes effective FOV (perceived zoom).
      //
      // Keep the horizontal framing by preserving the original horizontal
      // FOV and recomputing the vertical FOV for the new aspect.
      const oldAspect = Number.isFinite(camera.aspect) && camera.aspect > 0
        ? camera.aspect
        : 1;
      const newAspect = 1;
      const oldFovYDeg = camera.fov;

      const tanHalfFovY = Math.tan(
        THREE.MathUtils.degToRad(oldFovYDeg / 2)
      );
      // tan(fovX/2) = oldAspect * tan(fovY/2)
      // Want tan(fovX/2) same, but: tan(fovY'/2) = tan(fovX/2) / newAspect
      const tanHalfFovYNew = (oldAspect / newAspect) * tanHalfFovY;
      const newFovYDeg = THREE.MathUtils.radToDeg(
        2 * Math.atan(tanHalfFovYNew)
      );

      camera.fov = newFovYDeg;
      camera.aspect = newAspect;
      camera.updateProjectionMatrix();
    } else {
      // Orthographic or other: copy world pose into a new perspective camera.
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      cameraNode.getWorldPosition(worldPos);
      cameraNode.getWorldQuaternion(worldQuat);

      camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
      camera.position.copy(worldPos);
      camera.quaternion.copy(worldQuat);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
    }
  } else {
    // No camera in file: center and scale model, then use default framing.
    const bbox = new THREE.Box3().setFromObject(root);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    root.position.sub(center);

    bbox.setFromObject(root);
    const sphere = bbox.getBoundingSphere(new THREE.Sphere());
    const radius = sphere.radius || maxDim / 2;

    const targetRadius = 1.4;
    const scale = targetRadius / radius;
    root.scale.setScalar(scale);

    camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
    const dist =
      (radius * scale) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, dist * 0.22, dist * 0.85);
    camera.lookAt(0, 0, 0);
  }

  // Render one still frame.
  renderer.render(scene, camera);

  const dataUrl = canvas.toDataURL('image/png');

  // Cleanup to prevent leaks.
  try {
    disposeObject3D(root);
  } catch {
    // ignore cleanup failures
  }

  scene.remove(root);
  if (environmentTexture) {
    environmentTexture.dispose();
  }
  renderer.dispose();

  return dataUrl;
}

