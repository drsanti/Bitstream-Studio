/*******************************************************************************
 * File Name : resolveSimulationModelUrl.ts
 *
 * Description : Resolve GLB paths for simulations via webview asset strategy.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { resolveWebviewModelAssetUrl } from "../../../bitstream-app/components/3d-rotation/shared/resolveWebviewModelAssetUrl.js";

/**
 * Build a fetchable URL for a simulation model path (e.g. models/psoc-e84-ai/...).
 */
export function resolveSimulationModelUrl(relativeModelPath: string): string
{
  return resolveWebviewModelAssetUrl(relativeModelPath);
}
