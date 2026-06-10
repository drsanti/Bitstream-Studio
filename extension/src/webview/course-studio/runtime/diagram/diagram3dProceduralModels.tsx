import { Box, Capsule, Cone, Cylinder, Icosahedron, Plane, Sphere, Torus, TorusKnot } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { Diagram3dMaterialV1 } from "../../schemas/diagram.v1";
import type { Diagram3dProceduralModelIdV1 } from "./diagram3dModelId";
import {
  DEFAULT_DIAGRAM_3D_MESH_MATERIAL,
  PROCEDURAL_CHIP_DEFAULT_MATERIAL,
  PROCEDURAL_PCB_DEFAULT_MATERIAL,
} from "./diagram3dMaterial";
import { Diagram3dMeshMaterial } from "./Diagram3dMeshMaterial";

function axisArrowRotation(dir: [number, number, number]): [number, number, number] {
  const from = new THREE.Vector3(0, 1, 0);
  const to = new THREE.Vector3(...dir).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(from, to);
  const euler = new THREE.Euler().setFromQuaternion(quaternion);
  return [euler.x, euler.y, euler.z];
}

/** Mesh arrow (cylinder + cone) — avoids arrowHelper __r3f applyProps crashes in R3F 9+. */
function AxisArrow({
  dir,
  color,
  label: _label,
  length = 0.9,
  originY = 0.05,
}: {
  dir: [number, number, number];
  color: string;
  /** Reserved for future non-suspending labels. */
  label: string;
  length?: number;
  originY?: number;
}) {
  const rotation = useMemo(() => axisArrowRotation(dir), [dir[0], dir[1], dir[2]]);

  return (
    <group position={[0, originY, 0]} rotation={rotation}>
      <mesh position={[0, length * 0.46, 0]}>
        <cylinderGeometry args={[0.035, 0.035, length * 0.82, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, length * 0.92, 0]}>
        <coneGeometry args={[0.07, length * 0.18, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, length + 0.2, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ProceduralBoxMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Box args={[1.2, 1.2, 1.2]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Box>
  );
}

function ProceduralSphereMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Sphere args={[0.65, 32, 32]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Sphere>
  );
}

function ProceduralCylinderMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Cylinder args={[0.55, 0.55, 1.2, 32]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Cylinder>
  );
}

function ProceduralConeMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Cone args={[0.65, 1.2, 32]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Cone>
  );
}

function ProceduralPlaneMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Plane args={[2, 2]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Plane>
  );
}

function ProceduralTorusMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Torus args={[0.55, 0.18, 16, 32]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Torus>
  );
}

function ProceduralCapsuleMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Capsule args={[0.35, 0.8, 8, 16]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Capsule>
  );
}

function ProceduralRingMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <ringGeometry args={[0.35, 0.75, 48]} />
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </mesh>
  );
}

function ProceduralIcosahedronMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <Icosahedron args={[0.72, 0]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </Icosahedron>
  );
}

function ProceduralTorusKnotMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <TorusKnot args={[0.45, 0.14, 128, 16, 2, 3]} castShadow receiveShadow>
      <Diagram3dMeshMaterial
        defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
        material={material}
        opacity={opacity}
        emissiveBoost={emissiveBoost}
      />
    </TorusKnot>
  );
}

function ProceduralPcbMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <group>
      <Box args={[2.4, 0.08, 1.6]} castShadow receiveShadow>
        <Diagram3dMeshMaterial
          defaults={PROCEDURAL_PCB_DEFAULT_MATERIAL}
          material={material}
          opacity={opacity}
          emissiveBoost={emissiveBoost}
        />
      </Box>
      <Box args={[0.35, 0.12, 0.3]} position={[0, 0.1, 0]} castShadow>
        <Diagram3dMeshMaterial
          defaults={PROCEDURAL_CHIP_DEFAULT_MATERIAL}
          material={material}
          opacity={opacity}
          emissiveBoost={emissiveBoost}
        />
      </Box>
      <AxisArrow dir={[1, 0, 0]} color="#F87171" label="X" />
      <AxisArrow dir={[0, 0, -1]} color="#34D399" label="Y" />
      <AxisArrow dir={[0, 1, 0]} color="#60A5FA" label="Z" />
    </group>
  );
}

function ProceduralAxisTriadMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  return (
    <group position={[0, 0.1, 0]}>
      <Box args={[0.5, 0.08, 0.35]} castShadow receiveShadow>
        <Diagram3dMeshMaterial
          defaults={PROCEDURAL_PCB_DEFAULT_MATERIAL}
          material={material}
          opacity={opacity}
          emissiveBoost={emissiveBoost}
        />
      </Box>
      <AxisArrow dir={[1, 0, 0]} color="#F87171" label="X" length={1.1} originY={0} />
      <AxisArrow dir={[0, 0, -1]} color="#34D399" label="Y" length={1.1} originY={0} />
      <AxisArrow dir={[0, 1, 0]} color="#60A5FA" label="Z" length={1.1} originY={0} />
    </group>
  );
}

function ProceduralGyroGimbalMesh({
  opacity,
  emissiveBoost,
  material,
}: {
  opacity: number;
  emissiveBoost: number;
  material?: Diagram3dMaterialV1;
}) {
  const ringMaterial = (color: string, emissive: string) => (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={0.12 + emissiveBoost}
      roughness={0.3}
      metalness={0.7}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );

  return (
    <group>
      <mesh>
        <torusGeometry args={[1.6, 0.04, 16, 64]} />
        {ringMaterial("#F87171", "#F87171")}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.04, 16, 64]} />
        {ringMaterial("#34D399", "#34D399")}
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.8, 0.04, 16, 64]} />
        {ringMaterial("#60A5FA", "#60A5FA")}
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <Diagram3dMeshMaterial
          defaults={DEFAULT_DIAGRAM_3D_MESH_MATERIAL}
          material={material}
          opacity={opacity}
          emissiveBoost={emissiveBoost}
        />
      </mesh>
    </group>
  );
}

export function Diagram3dProceduralModelMesh({
  modelId,
  opacity = 1,
  selected = false,
  emissiveBoost,
  material,
}: {
  modelId: Diagram3dProceduralModelIdV1;
  opacity?: number;
  selected?: boolean;
  emissiveBoost?: number;
  material?: Diagram3dMaterialV1;
}) {
  const boost = emissiveBoost ?? (selected ? 0.22 : 0);

  switch (modelId) {
    case "procedural-box":
      return (
        <ProceduralBoxMesh opacity={opacity} emissiveBoost={boost} material={material} />
      );
    case "procedural-sphere":
      return (
        <ProceduralSphereMesh opacity={opacity} emissiveBoost={boost} material={material} />
      );
    case "procedural-cylinder":
      return (
        <ProceduralCylinderMesh
          opacity={opacity}
          emissiveBoost={boost}
          material={material}
        />
      );
    case "procedural-cone":
      return (
        <ProceduralConeMesh opacity={opacity} emissiveBoost={boost} material={material} />
      );
    case "procedural-plane":
      return (
        <ProceduralPlaneMesh opacity={opacity} emissiveBoost={boost} material={material} />
      );
    case "procedural-torus":
      return (
        <ProceduralTorusMesh opacity={opacity} emissiveBoost={boost} material={material} />
      );
    case "procedural-capsule":
      return (
        <ProceduralCapsuleMesh
          opacity={opacity}
          emissiveBoost={boost}
          material={material}
        />
      );
    case "procedural-ring":
      return (
        <ProceduralRingMesh opacity={opacity} emissiveBoost={boost} material={material} />
      );
    case "procedural-icosahedron":
      return (
        <ProceduralIcosahedronMesh
          opacity={opacity}
          emissiveBoost={boost}
          material={material}
        />
      );
    case "procedural-torus-knot":
      return (
        <ProceduralTorusKnotMesh
          opacity={opacity}
          emissiveBoost={boost}
          material={material}
        />
      );
    case "procedural-axis-triad":
      return (
        <ProceduralAxisTriadMesh
          opacity={opacity}
          emissiveBoost={boost}
          material={material}
        />
      );
    case "procedural-gyro-gimbal":
      return (
        <ProceduralGyroGimbalMesh
          opacity={opacity}
          emissiveBoost={boost}
          material={material}
        />
      );
    case "procedural-pcb":
    default:
      return (
        <ProceduralPcbMesh opacity={opacity} emissiveBoost={boost} material={material} />
      );
  }
}
