/*******************************************************************************
 * File Name : bmi270OutputProfiles.ts
 *
 * Description : BMI270 output presets — stream mode + SENSOR_CFG mask (3 presets).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BMI270_MASK } from "../../../bitstream2/domains/sensors/bmi270.js";
import type { Bmi270StreamModeUi } from "../state/bitstreamConfig.store.js";

/** Preset id matches firmware stream mode (`BMI270_MODE_SET`). */
export type Bmi270OutputPresetId = Bmi270StreamModeUi;

export type Bmi270OutputPresetDef = {
  id: Bmi270OutputPresetId;
  label: string;
  channels: string;
  /** Shown on preset hover ({@link TRNButton} `hint` / {@link TRNTooltip}). */
  hint: string;
  streamMode: Bmi270StreamModeUi;
  mask: number;
};

/** Raw — accel + gyro + temperature. */
export const BMI270_PROFILE_RAW_MASK =
  BMI270_MASK.ACC | BMI270_MASK.GYR | BMI270_MASK.TMP;

/** Fusion — Euler + quaternion. */
export const BMI270_PROFILE_FUSION_MASK = BMI270_MASK.EULER | BMI270_MASK.QUAT;

/** All channels — hybrid stream alternates raw IMU+temp and fusion frames. */
export const BMI270_PROFILE_ALL_MASK = 0x1f;

/** @deprecated use BMI270_PROFILE_RAW_MASK */
export const BMI270_PROFILE_IMU_TEMPERATURE_MASK = BMI270_PROFILE_RAW_MASK;

/** @deprecated use BMI270_PROFILE_FUSION_MASK */
export const BMI270_PROFILE_FULL_FUSION_MASK = BMI270_PROFILE_FUSION_MASK;

/** @deprecated use BMI270_PROFILE_ALL_MASK */
export const BMI270_PROFILE_HYBRID_FULL_MASK = BMI270_PROFILE_ALL_MASK;

export const BMI270_OUTPUT_PRESETS: readonly Bmi270OutputPresetDef[] = [
  {
    id: "raw",
    label: "Raw",
    channels: "Accel, Gyro, Temperature",
    hint: "Live accelerometer, gyroscope, and temperature in Telemetry Data.",
    streamMode: "raw",
    mask: BMI270_PROFILE_RAW_MASK,
  },
  {
    id: "fusion",
    label: "Fusion",
    channels: "Euler, Quaternion",
    hint: "Live orientation only — heading, pitch, roll, and quaternion in Telemetry Data.",
    streamMode: "fusion",
    mask: BMI270_PROFILE_FUSION_MASK,
  },
  {
    id: "hybrid",
    label: "All",
    channels: "Accel, Gyro, Temp, Euler, Quaternion",
    hint: "Motion sensors plus orientation in Telemetry Data — values update in alternating groups.",
    streamMode: "hybrid",
    mask: BMI270_PROFILE_ALL_MASK,
  },
] as const;

export function getBmi270OutputPreset(id: Bmi270OutputPresetId): Bmi270OutputPresetDef
{
  const found = BMI270_OUTPUT_PRESETS.find((p) => p.id === id);
  return found ?? BMI270_OUTPUT_PRESETS[0]!;
}

/** Infer stream mode from SENSOR_CFG mask when it matches exactly one preset row. */
export function inferBmi270StreamModeFromMask(mask: number): Bmi270StreamModeUi | null
{
  const m = mask & 0xff;
  let match: Bmi270StreamModeUi | null = null;
  for (const preset of BMI270_OUTPUT_PRESETS)
  {
    if (preset.mask !== m)
    {
      continue;
    }
    if (match != null)
    {
      return null;
    }
    match = preset.streamMode;
  }
  return match;
}

/** Active preset when draft mask + stream mode match a built-in row; else null (custom). */
export function resolveBmi270OutputPresetId(
  mask: number,
  streamMode: Bmi270StreamModeUi,
): Bmi270OutputPresetId | null
{
  const m = mask & 0xff;
  for (const preset of BMI270_OUTPUT_PRESETS)
  {
    if (preset.streamMode === streamMode && preset.mask === m)
    {
      return preset.id;
    }
  }
  return null;
}

export type Bmi270OutputPresetDisplayInput = {
  draftMask: number;
  firmwareMask: number;
  draftStreamMode: Bmi270StreamModeUi;
  /** Last BMI270_MODE_GET baseline; null before first firmware read this session. */
  firmwareStreamMode: Bmi270StreamModeUi | null;
  maskUserDirty: boolean;
  streamModeUserDirty: boolean;
  /** Draft-until-Apply: operator picked a preset but has not Applied yet. */
  outputProfileUserEdited: boolean;
};

/**
 * Preset highlight for Raw / Fusion / All.
 *
 * BMI270 output preset id matches stream mode (`raw` / `fusion` / `hybrid`). On UART,
 * SENSOR_CFG mask and BMI270_MODE_GET can be briefly out of sync after refresh; when
 * not editing, trust MODE GET (or mask inference before GET completes).
 */
export function resolveBmi270OutputPresetDisplayState(
  input: Bmi270OutputPresetDisplayInput,
): {
  presetId: Bmi270OutputPresetId | null;
  mask: number;
  streamMode: Bmi270StreamModeUi;
}
{
  const draftMask = input.draftMask & 0xff;
  const firmwareMask = input.firmwareMask & 0xff;
  const isEditing =
    input.outputProfileUserEdited || input.maskUserDirty || input.streamModeUserDirty;

  if (isEditing)
  {
    const streamMode = input.draftStreamMode;
    const paired = resolveBmi270OutputPresetId(draftMask, streamMode);
    if (paired != null)
    {
      return { presetId: paired, mask: draftMask, streamMode };
    }
    /* Preset row click updates stream mode before parent re-renders with new mask. */
    if (input.outputProfileUserEdited || input.streamModeUserDirty)
    {
      return { presetId: streamMode, mask: draftMask, streamMode };
    }
    return { presetId: null, mask: draftMask, streamMode };
  }

  if (input.firmwareStreamMode != null)
  {
    return {
      presetId: input.firmwareStreamMode,
      mask: firmwareMask,
      streamMode: input.firmwareStreamMode,
    };
  }

  const inferred = inferBmi270StreamModeFromMask(firmwareMask);
  const streamMode = inferred ?? input.draftStreamMode;
  return {
    presetId:
      inferred != null ? inferred : resolveBmi270OutputPresetId(firmwareMask, streamMode),
    mask: firmwareMask,
    streamMode,
  };
}

export function isBmi270CustomOutput(mask: number, streamMode: Bmi270StreamModeUi): boolean
{
  return resolveBmi270OutputPresetId(mask, streamMode) == null;
}

export function bmi270DraftForOutputPreset(presetId: Bmi270OutputPresetId): {
  streamMode: Bmi270StreamModeUi;
  mask: number;
}
{
  const preset = getBmi270OutputPreset(presetId);
  return { streamMode: preset.streamMode, mask: preset.mask & 0xff };
}

export function formatBmi270MaskHex(mask: number): string
{
  return `0x${(mask & 0xff).toString(16).padStart(2, "0")}`;
}

export function describeBmi270StreamModeLabel(mode: Bmi270StreamModeUi): string
{
  switch (mode)
  {
    case "raw":
      return "Raw";
    case "fusion":
      return "Fusion";
    case "hybrid":
      return "All";
  }
}
