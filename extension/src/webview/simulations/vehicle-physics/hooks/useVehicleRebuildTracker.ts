/*******************************************************************************
 * File Name : useVehicleRebuildTracker.ts
 *
 * Description : Tracks vehicle config fields that require a Jolt rebuild.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useMemo, useRef, useState } from "react";
import type { CastType } from "../config/vehicleConfig.js";
import { useVehicleConfigStore } from "../store/vehicle-config-store.js";

type RebuildSnapshot = {
  suspensionMinLength: number;
  suspensionMaxLength: number;
  maxSteerAngle: number;
  fourWheelDrive: boolean;
  frontBackLimitedSlipRatio: number;
  leftRightLimitedSlipRatio: number;
  antiRollbar: boolean;
  vehicleMass: number;
  wheelFriction: number;
  maxPitchRollAngle: number;
  engineSoundBaseVolume: number;
  engineSoundAnimationDuration: number;
  bodyPositionX: number;
  bodyPositionY: number;
  bodyPositionZ: number;
  castType: CastType;
  wheelRadius: number;
  wheelWidth: number;
  halfVehicleLength: number;
  halfVehicleWidth: number;
  halfVehicleHeight: number;
};

/** Snapshot rebuild-required fields from the config store. */
function snapshotFromStore(): RebuildSnapshot
{
  const s = useVehicleConfigStore.getState();
  return {
    suspensionMinLength: s.suspensionMinLength,
    suspensionMaxLength: s.suspensionMaxLength,
    maxSteerAngle: s.maxSteerAngle,
    fourWheelDrive: s.fourWheelDrive,
    frontBackLimitedSlipRatio: s.frontBackLimitedSlipRatio,
    leftRightLimitedSlipRatio: s.leftRightLimitedSlipRatio,
    antiRollbar: s.antiRollbar,
    vehicleMass: s.vehicleMass,
    wheelFriction: s.wheelFriction,
    maxPitchRollAngle: s.maxPitchRollAngle,
    engineSoundBaseVolume: s.engineSoundBaseVolume,
    engineSoundAnimationDuration: s.engineSoundAnimationDuration,
    bodyPositionX: s.bodyPositionX,
    bodyPositionY: s.bodyPositionY,
    bodyPositionZ: s.bodyPositionZ,
    castType: s.castType,
    wheelRadius: s.wheelRadius,
    wheelWidth: s.wheelWidth,
    halfVehicleLength: s.halfVehicleLength,
    halfVehicleWidth: s.halfVehicleWidth,
    halfVehicleHeight: s.halfVehicleHeight,
  };
}

/** Count differing rebuild fields vs baseline. */
function countPending(initial: RebuildSnapshot, current: RebuildSnapshot): number
{
  let count = 0;
  (Object.keys(initial) as (keyof RebuildSnapshot)[]).forEach((key) => {
    if (initial[key] !== current[key])
    {
      count++;
    }
  });
  return count;
}

/**
 * Pending rebuild change detection (T3D vehicle-config-panel parity).
 */
export function useVehicleRebuildTracker()
{
  const baselineRef = useRef<RebuildSnapshot | null>(null);
  const [rebuildTick, setRebuildTick] = useState(0);

  const suspensionMinLength = useVehicleConfigStore((s) => s.suspensionMinLength);
  const suspensionMaxLength = useVehicleConfigStore((s) => s.suspensionMaxLength);
  const maxSteerAngle = useVehicleConfigStore((s) => s.maxSteerAngle);
  const fourWheelDrive = useVehicleConfigStore((s) => s.fourWheelDrive);
  const frontBackLimitedSlipRatio = useVehicleConfigStore(
    (s) => s.frontBackLimitedSlipRatio,
  );
  const leftRightLimitedSlipRatio = useVehicleConfigStore(
    (s) => s.leftRightLimitedSlipRatio,
  );
  const antiRollbar = useVehicleConfigStore((s) => s.antiRollbar);
  const vehicleMass = useVehicleConfigStore((s) => s.vehicleMass);
  const wheelFriction = useVehicleConfigStore((s) => s.wheelFriction);
  const maxPitchRollAngle = useVehicleConfigStore((s) => s.maxPitchRollAngle);
  const engineSoundBaseVolume = useVehicleConfigStore(
    (s) => s.engineSoundBaseVolume,
  );
  const engineSoundAnimationDuration = useVehicleConfigStore(
    (s) => s.engineSoundAnimationDuration,
  );
  const bodyPositionX = useVehicleConfigStore((s) => s.bodyPositionX);
  const bodyPositionY = useVehicleConfigStore((s) => s.bodyPositionY);
  const bodyPositionZ = useVehicleConfigStore((s) => s.bodyPositionZ);
  const castType = useVehicleConfigStore((s) => s.castType);
  const wheelRadius = useVehicleConfigStore((s) => s.wheelRadius);
  const wheelWidth = useVehicleConfigStore((s) => s.wheelWidth);
  const halfVehicleLength = useVehicleConfigStore((s) => s.halfVehicleLength);
  const halfVehicleWidth = useVehicleConfigStore((s) => s.halfVehicleWidth);
  const halfVehicleHeight = useVehicleConfigStore((s) => s.halfVehicleHeight);

  useEffect(() => {
    if (baselineRef.current === null)
    {
      baselineRef.current = snapshotFromStore();
    }
  }, []);

  const { hasPendingRebuildChanges, pendingChangesCount } = useMemo(() => {
    if (baselineRef.current === null)
    {
      return { hasPendingRebuildChanges: false, pendingChangesCount: 0 };
    }
    const current: RebuildSnapshot = {
      suspensionMinLength,
      suspensionMaxLength,
      maxSteerAngle,
      fourWheelDrive,
      frontBackLimitedSlipRatio,
      leftRightLimitedSlipRatio,
      antiRollbar,
      vehicleMass,
      wheelFriction,
      maxPitchRollAngle,
      engineSoundBaseVolume,
      engineSoundAnimationDuration,
      bodyPositionX,
      bodyPositionY,
      bodyPositionZ,
      castType,
      wheelRadius,
      wheelWidth,
      halfVehicleLength,
      halfVehicleWidth,
      halfVehicleHeight,
    };
    const pendingChangesCount = countPending(baselineRef.current, current);
    return {
      hasPendingRebuildChanges: pendingChangesCount > 0,
      pendingChangesCount,
    };
  }, [
    suspensionMinLength,
    suspensionMaxLength,
    maxSteerAngle,
    fourWheelDrive,
    frontBackLimitedSlipRatio,
    leftRightLimitedSlipRatio,
    antiRollbar,
    vehicleMass,
    wheelFriction,
    maxPitchRollAngle,
    engineSoundBaseVolume,
    engineSoundAnimationDuration,
    bodyPositionX,
    bodyPositionY,
    bodyPositionZ,
    castType,
    wheelRadius,
    wheelWidth,
    halfVehicleLength,
    halfVehicleWidth,
    halfVehicleHeight,
    rebuildTick,
  ]);

  const commitBaselineAfterRebuild = (): void =>
  {
    baselineRef.current = snapshotFromStore();
    setRebuildTick((t) => t + 1);
  };

  return {
    hasPendingRebuildChanges,
    pendingChangesCount,
    commitBaselineAfterRebuild,
  };
}
