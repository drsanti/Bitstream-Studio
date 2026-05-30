import React from 'react';

type PoseNumbers = {
  px: number;
  py: number;
  pz: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  exDeg: number;
  eyDeg: number;
  ezDeg: number;
  fov: number;
  near: number;
  far: number;
  aspect: number;
  tx: number;
  ty: number;
  tz: number;
};

export interface CameraDebugSnapshot {
  target: PoseNumbers;
  current: PoseNumbers;
  posDiff: number;
  quatDiffDeg: number;
  posOk: boolean;
  quatOk: boolean;
  canvasW: number;
  canvasH: number;
  canvasAspect: number;
}

export interface PreviewDebugPanelProps {
  cameraDebug: CameraDebugSnapshot | null;
  selectedObjectName: string | null;
  referenceObjectName: string | null;
  lastObjectOrigin: { x: number; y: number; z: number } | null;
  lastHitPoint: { x: number; y: number; z: number } | null;
}

export function PreviewDebugPanel({
  cameraDebug,
  selectedObjectName,
  referenceObjectName,
  lastObjectOrigin,
  lastHitPoint,
}: PreviewDebugPanelProps) {
  if (!cameraDebug) {
    return <div className="text-gray-300 text-[11px]">Waiting for model camera...</div>;
  }

  return (
    <div className="text-[11px] leading-snug text-gray-100">
      {selectedObjectName && <div className="mb-1 text-gray-200">Selected: {selectedObjectName}</div>}
      {referenceObjectName && <div className="mb-1 text-gray-200">Reference: {referenceObjectName}</div>}
      {lastObjectOrigin && (
        <div className="mb-1 text-gray-300">
          Obj origin: {lastObjectOrigin.x.toFixed(3)}, {lastObjectOrigin.y.toFixed(3)},{' '}
          {lastObjectOrigin.z.toFixed(3)}
        </div>
      )}
      {lastHitPoint && (
        <div className="mb-1 text-gray-300">
          Hit point: {lastHitPoint.x.toFixed(3)}, {lastHitPoint.y.toFixed(3)},{' '}
          {lastHitPoint.z.toFixed(3)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <div className="text-gray-300">Target</div>
        <div className="text-gray-300">Current</div>

        <div>Pos: {cameraDebug.target.px.toFixed(3)}, {cameraDebug.target.py.toFixed(3)}, {cameraDebug.target.pz.toFixed(3)}</div>
        <div>Pos: {cameraDebug.current.px.toFixed(3)}, {cameraDebug.current.py.toFixed(3)}, {cameraDebug.current.pz.toFixed(3)}</div>

        <div>Euler: {cameraDebug.target.exDeg.toFixed(3)}, {cameraDebug.target.eyDeg.toFixed(3)}, {cameraDebug.target.ezDeg.toFixed(3)}</div>
        <div>Euler: {cameraDebug.current.exDeg.toFixed(3)}, {cameraDebug.current.eyDeg.toFixed(3)}, {cameraDebug.current.ezDeg.toFixed(3)}</div>

        <div>Quat: {cameraDebug.target.qx.toFixed(3)}, {cameraDebug.target.qy.toFixed(3)}, {cameraDebug.target.qz.toFixed(3)}, {cameraDebug.target.qw.toFixed(3)}</div>
        <div>Quat: {cameraDebug.current.qx.toFixed(3)}, {cameraDebug.current.qy.toFixed(3)}, {cameraDebug.current.qz.toFixed(3)}, {cameraDebug.current.qw.toFixed(3)}</div>

        <div>LookAt: {cameraDebug.target.tx.toFixed(3)}, {cameraDebug.target.ty.toFixed(3)}, {cameraDebug.target.tz.toFixed(3)}</div>
        <div>LookAt: {cameraDebug.current.tx.toFixed(3)}, {cameraDebug.current.ty.toFixed(3)}, {cameraDebug.current.tz.toFixed(3)}</div>
      </div>

      <div className="mt-2 text-gray-200">
        <div>
          Pos diff: {cameraDebug.posDiff.toFixed(6)} ({cameraDebug.posOk ? 'OK' : 'FAIL'})
        </div>
        <div>
          Quat diff: {cameraDebug.quatDiffDeg.toFixed(3)} deg ({cameraDebug.quatOk ? 'OK' : 'FAIL'})
        </div>
        <div>
          Canvas: {cameraDebug.canvasW}x{cameraDebug.canvasH} (aspect {cameraDebug.canvasAspect.toFixed(3)})
        </div>
        <div>
          Proj: fov {cameraDebug.current.fov.toFixed(3)}, near {cameraDebug.current.near.toFixed(3)}, far {cameraDebug.current.far.toFixed(3)}, aspect {cameraDebug.current.aspect.toFixed(3)}
        </div>
      </div>
    </div>
  );
}
