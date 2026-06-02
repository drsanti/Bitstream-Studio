import type { ReactNode } from 'react';
import { useState } from 'react';
import { Box, Camera, GitCompare, Monitor } from 'lucide-react';
import {
  TRNAxisVectorReadout,
  TRNCard,
  TRNChipButtonGroup,
  TRNHintText,
  TRNHintTooltip,
  TRNKeyValueRow,
  TRNPoseCompareStack,
  formatTrnAxisNumber,
} from '../../ui/TRN/index.js';
import type {
  CameraDebugSnapshot,
  ObjectTransformSpace,
  PreviewDebugPanelProps,
  Vec3Snapshot,
} from './PreviewDebugPanel.types.js';

function DebugSectionCard({
  title,
  icon,
  iconHint,
  titleTrailing,
  defaultExpanded = true,
  children,
}: {
  title: string;
  icon?: ReactNode;
  /** Shown in a hover tooltip on the header icon (TRNHintTooltip). */
  iconHint?: string;
  titleTrailing?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  const headerIcon =
    icon != null && iconHint != null && iconHint.length > 0 ? (
      <TRNHintTooltip
        trigger={icon}
        content={iconHint}
        triggerAriaLabel={`About ${title}`}
        placement="top-start"
      />
    ) : (
      icon
    );

  return (
    <TRNCard
      title={title}
      icon={headerIcon}
      titleTrailing={titleTrailing}
      defaultExpanded={defaultExpanded}
      collapsible
      glass
      glassPreset="soft"
      contentClassName="space-y-2"
    >
      {children}
    </TRNCard>
  );
}

function PoseCheckStatusPill({
  mode,
  ok,
}: {
  mode: CameraDebugSnapshot['poseCheckMode'];
  ok: boolean;
}) {
  if (mode === 'drift') {
    return (
      <span className="inline-flex items-center rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
        Diff
      </span>
    );
  }

  return (
    <span
      className={
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ' +
        (ok
          ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
          : 'border-rose-500/35 bg-rose-500/10 text-rose-300')
      }
    >
      {ok ? 'OK' : 'Fail'}
    </span>
  );
}

function PoseCheckMetricRow({
  name,
  mode,
  ok,
  deltaLabel,
  axisDelta,
  axisDecimals = 3,
}: {
  name: string;
  mode: CameraDebugSnapshot['poseCheckMode'];
  ok: boolean;
  deltaLabel: string;
  axisDelta?: Vec3Snapshot;
  axisDecimals?: number;
}) {
  return (
    <div className="space-y-1 text-[11px]">
      <div className="font-medium text-zinc-500">{name}</div>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <PoseCheckStatusPill mode={mode} ok={ok} />
        <span className="text-zinc-400">{deltaLabel}</span>
      </div>
      {axisDelta != null ? (
        <div className="space-y-1 pt-0.5">
          <div className="text-[10px] text-zinc-600">Δ per axis (current − target)</div>
          <TRNAxisVectorReadout
            axes={['x', 'y', 'z']}
            values={axisDelta}
            decimals={axisDecimals}
          />
        </div>
      ) : null}
    </div>
  );
}

export function PreviewDebugPanel({
  cameraDebug,
  selectedObjectName,
  referenceObjectName,
  selectedObjectTransform,
  selectionHighlightMode,
  modelDisplayMode,
  lastHitPoint,
}: PreviewDebugPanelProps) {
  const [transformSpace, setTransformSpace] =
    useState<ObjectTransformSpace>('world');

  if (!cameraDebug) {
    return (
      <TRNHintText className="text-[11px]">Waiting for model camera…</TRNHintText>
    );
  }

  const { target, current } = cameraDebug;
  const driftMode = cameraDebug.poseCheckMode === 'drift';
  const hasSceneContext =
    selectedObjectName != null ||
    referenceObjectName != null ||
    selectedObjectTransform != null ||
    lastHitPoint != null ||
    modelDisplayMode.length > 0;

  const activeTransform =
    selectedObjectTransform != null
      ? selectedObjectTransform[transformSpace]
      : null;

  const loadPoseHint = driftMode
    ? 'Drift vs camera at GLB load — expected after orbit / zoom / pan.'
    : 'OK when live camera matches the embedded GLB camera (before orbit).';

  const loadPoseHeaderSummary =
    driftMode ? (
      <span className="text-[10px] text-amber-300/90">
        Δ {formatTrnAxisNumber(cameraDebug.posDiff, 2)}
      </span>
    ) : (
      <PoseCheckStatusPill
        mode={cameraDebug.poseCheckMode}
        ok={cameraDebug.posOk && cameraDebug.quatOk}
      />
    );

  return (
    <div className="space-y-2">
      {hasSceneContext ? (
        <DebugSectionCard
          title="Scene"
          icon={<Box className="h-4 w-4" />}
          defaultExpanded
        >
          {referenceObjectName ? (
            <TRNKeyValueRow label="Reference" value={referenceObjectName} />
          ) : null}
          <TRNKeyValueRow
            label="Model view"
            value={
              <span className="text-zinc-500">
                {modelDisplayMode}
                <span className="text-zinc-600"> · Preview Controls</span>
              </span>
            }
          />
          {selectedObjectName ? (
            <TRNKeyValueRow label="Selected" value={selectedObjectName} />
          ) : null}
          {selectedObjectName ? (
            <TRNKeyValueRow
              label="Highlight"
              value={
                <span className="text-zinc-500">
                  {selectionHighlightMode}
                  <span className="text-zinc-600"> · Preview Controls</span>
                </span>
              }
            />
          ) : null}
          {activeTransform ? (
            <>
              <TRNChipButtonGroup
                label="Space"
                value={transformSpace}
                onChange={setTransformSpace}
                options={[
                  { value: 'world', label: 'World' },
                  { value: 'local', label: 'Local' },
                ]}
                columns={2}
                ariaLabel="Transform coordinate space"
              />
              <TRNKeyValueRow
                label="Position"
                value={
                  <TRNAxisVectorReadout
                    axes={['x', 'y', 'z']}
                    values={activeTransform.position}
                  />
                }
              />
              <TRNKeyValueRow
                label="Rotation (°)"
                value={
                  <TRNAxisVectorReadout
                    axes={['x', 'y', 'z']}
                    values={activeTransform.rotationDeg}
                    decimals={2}
                  />
                }
              />
              <TRNKeyValueRow
                label="Scale"
                value={
                  <TRNAxisVectorReadout
                    axes={['x', 'y', 'z']}
                    values={activeTransform.scale}
                  />
                }
              />
            </>
          ) : null}
          {lastHitPoint ? (
            <TRNKeyValueRow
              label="Hit point"
              value={
                <TRNAxisVectorReadout
                  axes={['x', 'y', 'z']}
                  values={{
                    x: lastHitPoint.x,
                    y: lastHitPoint.y,
                    z: lastHitPoint.z,
                  }}
                />
              }
            />
          ) : null}
        </DebugSectionCard>
      ) : null}

      <DebugSectionCard
        title="Camera load check"
        icon={<Camera className="h-4 w-4" />}
        iconHint={loadPoseHint}
        titleTrailing={loadPoseHeaderSummary}
        defaultExpanded
      >
        <PoseCheckMetricRow
          name="Position"
          mode={cameraDebug.poseCheckMode}
          ok={cameraDebug.posOk}
          deltaLabel={`Δ ${formatTrnAxisNumber(cameraDebug.posDiff, 6)}`}
          axisDelta={cameraDebug.posDiffAxis}
        />
        <PoseCheckMetricRow
          name="Rotation"
          mode={cameraDebug.poseCheckMode}
          ok={cameraDebug.quatOk}
          deltaLabel={`Δ ${formatTrnAxisNumber(cameraDebug.quatDiffDeg, 3)}°`}
        />
      </DebugSectionCard>

      <DebugSectionCard
        title="Camera compare"
        icon={<GitCompare className="h-4 w-4" />}
        defaultExpanded
      >
        <TRNPoseCompareStack
          rows={[
            {
              label: 'Position',
              axes: ['x', 'y', 'z'],
              target: { x: target.px, y: target.py, z: target.pz },
              current: { x: current.px, y: current.py, z: current.pz },
            },
            {
              label: 'Euler',
              axes: ['x', 'y', 'z'],
              target: { x: target.exDeg, y: target.eyDeg, z: target.ezDeg },
              current: { x: current.exDeg, y: current.eyDeg, z: current.ezDeg },
              decimals: 2,
            },
            {
              label: 'Quaternion',
              axes: ['x', 'y', 'z', 'w'],
              target: { x: target.qx, y: target.qy, z: target.qz, w: target.qw },
              current: { x: current.qx, y: current.qy, z: current.qz, w: current.qw },
            },
            {
              label: 'Look-at',
              axes: ['x', 'y', 'z'],
              target: { x: target.tx, y: target.ty, z: target.tz },
              current: { x: current.tx, y: current.ty, z: current.tz },
            },
          ]}
        />
      </DebugSectionCard>

      <DebugSectionCard
        title="Viewport"
        icon={<Monitor className="h-4 w-4" />}
        defaultExpanded={false}
      >
        <TRNKeyValueRow
          label="Canvas"
          value={
            <span className="text-zinc-300">
              {cameraDebug.canvasW} × {cameraDebug.canvasH}
              <span className="text-zinc-500"> · aspect </span>
              {formatTrnAxisNumber(cameraDebug.canvasAspect, 3)}
            </span>
          }
        />
        <TRNKeyValueRow
          label="Projection"
          value={
            <span className="text-zinc-300">
              fov {formatTrnAxisNumber(current.fov, 1)}°
              <span className="text-zinc-500"> · near </span>
              {formatTrnAxisNumber(current.near, 3)}
              <span className="text-zinc-500"> · far </span>
              {formatTrnAxisNumber(current.far, 1)}
              <span className="text-zinc-500"> · aspect </span>
              {formatTrnAxisNumber(current.aspect, 3)}
            </span>
          }
        />
      </DebugSectionCard>
    </div>
  );
}
