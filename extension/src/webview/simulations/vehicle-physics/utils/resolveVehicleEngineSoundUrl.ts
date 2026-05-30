/*******************************************************************************
 * File Name : resolveVehicleEngineSoundUrl.ts
 *
 * Description : Resolve bundled car-engine.mp3 for webview and Vite dev.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { joinAssetBase } from "../../../asset-source-strategy.js";
import { resolveSimulationModelUrl } from "../../shared/assets/resolveSimulationModelUrl.js";

/** Relative path under `out/webview/assets/` after Vite static copy. */
export const VEHICLE_ENGINE_SOUND_REL = "sounds/car-engine.mp3";

/** Online fallback when bundled asset is unavailable (browser dev without copy). */
const REMOTE_ENGINE_SOUND_URL =
  "https://raw.githubusercontent.com/drsanti/ternion-3d-assets/main/sounds/car-engine.mp3";

/**
 * Build a fetchable URL for the vehicle engine loop MP3 (local assets first).
 */
export function resolveVehicleEngineSoundUrl(): string
{
  if (typeof window !== "undefined")
  {
    const local = window.LOCAL_ASSETS_BASE_URI?.trim();
    if (local)
    {
      return joinAssetBase(local, VEHICLE_ENGINE_SOUND_REL);
    }

    if (import.meta.env.DEV)
    {
      const base = import.meta.env.BASE_URL ?? "/";
      const root = new URL(base, window.location.href);
      return new URL(`assets/${VEHICLE_ENGINE_SOUND_REL}`, root).href;
    }
  }

  return resolveSimulationModelUrl(VEHICLE_ENGINE_SOUND_REL);
}

/** Remote fallback when bundled MP3 is missing from the webview bundle. */
export function getRemoteVehicleEngineSoundUrl(): string
{
  return REMOTE_ENGINE_SOUND_URL;
}
