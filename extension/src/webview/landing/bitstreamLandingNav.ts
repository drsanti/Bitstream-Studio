/*******************************************************************************
 * File Name : bitstreamLandingNav.ts
 *
 * Description : Dev URL helpers for the Bitstream Studio browser landing page.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamWorkspaceId } from "../bitstream-app/state/bitstreamWorkspaceMode.store.js";
import { isViteDevMode } from "../utils/isViteDevMode.js";

const LANDING_SKIP_KEY = "bitstream-studio.landing.skip.v1";

/**
 * True when the browser dev shell should show the workspace picker landing first.
 * VS Code webview skips landing (host opens the panel directly).
 */
export function shouldShowBitstreamLanding(): boolean
{
  if (typeof window === "undefined")
  {
    return false;
  }
  if (window.WEBVIEW_READY === true)
  {
    return false;
  }
  if (!isViteDevMode())
  {
    return false;
  }

  try
  {
    const params = new URLSearchParams(window.location.search);
    const landing = params.get("landing");
    if (landing === "0" || landing === "false")
    {
      return false;
    }
    if (landing === "1" || landing === "true")
    {
      return true;
    }
    if (sessionStorage.getItem(LANDING_SKIP_KEY) === "1")
    {
      return false;
    }
    const app = params.get("app");
    const workspace = params.get("workspace");
    const sim = params.get("sim");
    if (sim != null && sim.length > 0)
    {
      return false;
    }
    if (
      app === "bitstream" ||
      app === "sensor-studio" ||
      app === "sensor-telemetry" ||
      workspace === "sensor-studio" ||
      workspace === "sensor-telemetry" ||
      workspace === "presentation" ||
      workspace === "course-studio"
    )
    {
      return false;
    }
    return true;
  }
  catch
  {
    return false;
  }
}

/** Update dev browser URL `?app=bitstream&workspace=` when switching workspaces (toolbar, landing, shortcuts). */
export function syncDevBitstreamWorkspaceUrl(workspace: BitstreamWorkspaceId): void
{
  if (typeof window === "undefined" || !isViteDevMode())
  {
    return;
  }

  try
  {
    const url = new URL(window.location.href);
    url.searchParams.set("app", "bitstream");
    url.searchParams.set("workspace", workspace);
    url.searchParams.delete("landing");
    window.history.replaceState({}, "", url);
  }
  catch
  {
    // ignore
  }
}

/** Persist skip + set dev URL after the user picks a workspace on the landing page. */
export function commitBitstreamLandingChoice(workspace: BitstreamWorkspaceId): void
{
  if (typeof window === "undefined")
  {
    return;
  }
  try
  {
    sessionStorage.setItem(LANDING_SKIP_KEY, "1");
  }
  catch
  {
    // ignore
  }

  syncDevBitstreamWorkspaceUrl(workspace);
}
