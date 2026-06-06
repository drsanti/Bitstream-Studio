/*******************************************************************************
 * File Name : unregisterStaleCoiServiceWorker.ts
 *
 * Description : Remove stale t3d-coi service workers on Vite dev (localhost).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { isViteDevMode } from "./isViteDevMode.js";

const COI_SW_MARKER = "t3d-coi-serviceworker";
const RELOAD_ONCE_KEY = "bitstream-studio.coi-sw-cleanup-reload";

function scriptUrlIncludesCoi(scriptUrl: string | undefined): boolean
{
  return scriptUrl != null && scriptUrl.includes(COI_SW_MARKER);
}

/**
 * Unregister leftover Jolt COI workers from T3D / vehicle sessions on the same dev port.
 * Returns true when a reload was triggered to drop the active controller.
 */
export async function unregisterStaleCoiServiceWorker(): Promise<boolean>
{
  if (typeof window === "undefined" || !isViteDevMode())
  {
    return false;
  }

  if (!navigator.serviceWorker?.getRegistrations)
  {
    return false;
  }

  let registrations: readonly ServiceWorkerRegistration[];
  try
  {
    registrations = await navigator.serviceWorker.getRegistrations();
  }
  catch
  {
    // InvalidStateError — embedded webview / navigation / HMR timing
    return false;
  }
  const coiRegs = registrations.filter((reg) =>
  {
    const url =
      reg.active?.scriptURL ??
      reg.waiting?.scriptURL ??
      reg.installing?.scriptURL ??
      "";
    return scriptUrlIncludesCoi(url);
  });

  const controllerIsCoi = scriptUrlIncludesCoi(
    navigator.serviceWorker.controller?.scriptURL,
  );

  if (coiRegs.length === 0 && !controllerIsCoi)
  {
    try
    {
      sessionStorage.removeItem(RELOAD_ONCE_KEY);
    }
    catch
    {
      // ignore
    }
    return false;
  }

  await Promise.all(coiRegs.map((reg) => reg.unregister()));

  if (controllerIsCoi)
  {
    try
    {
      if (sessionStorage.getItem(RELOAD_ONCE_KEY) !== "1")
      {
        sessionStorage.setItem(RELOAD_ONCE_KEY, "1");
        window.location.reload();
        return true;
      }
      sessionStorage.removeItem(RELOAD_ONCE_KEY);
    }
    catch
    {
      window.location.reload();
      return true;
    }
  }

  try
  {
    sessionStorage.removeItem(RELOAD_ONCE_KEY);
  }
  catch
  {
    // ignore
  }

  return false;
}
