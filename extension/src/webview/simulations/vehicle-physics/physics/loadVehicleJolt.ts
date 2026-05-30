/*******************************************************************************
 * File Name : loadVehicleJolt.ts
 *
 * Description : Load single-thread Jolt WASM for vehicle physics (webview-safe).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { joinAssetBase } from "../../../asset-source-strategy.js";
import { T3DJoltLoader } from "@vehicle-jolt/jolt-loader/index.js";
import type { JoltModule } from "@vehicle-jolt/jolt-loader/types.js";

/**
 * Resolve Jolt WASM base URL (webview LOCAL_ASSETS/jolt, browser /jolt, Vite dev).
 */
export function resolveVehicleJoltBaseUrl(): string
{
  const auto = T3DJoltLoader.resolveBaseUrl(undefined);

  if (typeof window === "undefined")
  {
    return auto;
  }

  const local = window.LOCAL_ASSETS_BASE_URI?.trim();
  if (local)
  {
    return joinAssetBase(local, "jolt");
  }

  if (import.meta.env.DEV)
  {
    const base = import.meta.env.BASE_URL ?? "/";
    const root = new URL(base, window.location.href);
    return new URL("assets/jolt", root).href.replace(/\/$/, "");
  }

  return auto;
}

/**
 * Load Jolt Physics (single-thread only — no COI / pthread in VS Code webview).
 */
export async function loadVehicleJolt(): Promise<JoltModule>
{
  const baseUrl = resolveVehicleJoltBaseUrl();
  const result = await T3DJoltLoader.loadJolt({
    baseUrl,
    preferThreads: false,
    quiet: false,
  });

  if (!result.Jolt)
  {
    throw result.error ?? new Error("Failed to load Jolt Physics");
  }

  return result.Jolt;
}
