import { useCallback, useEffect, useState } from "react";
import {
  loadProject4HudHiddenPanelIds,
  PROJECT4_HUD_PANELS_CHANGED_EVENT,
  setProject4HudPanelHidden,
  toggleProject4HudPanelHidden,
  type Project4HudPersistPanelId,
} from "../lib/project4-hud-layout";

/**
 * Syncs HUD panel visibility with **`ternion.project4.hudLayout.v1`** `hiddenPanelIds`
 * and cross-component **`PROJECT4_HUD_PANELS_CHANGED_EVENT`**.
 */
export function useProject4HudPanelVisibility() {
  const [hidden, setHidden] = useState(() => new Set(loadProject4HudHiddenPanelIds()));

  useEffect(() => {
    const sync = () => setHidden(new Set(loadProject4HudHiddenPanelIds()));
    window.addEventListener(PROJECT4_HUD_PANELS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PROJECT4_HUD_PANELS_CHANGED_EVENT, sync);
  }, []);

  const hidePanel = useCallback((id: Project4HudPersistPanelId) => {
    setProject4HudPanelHidden(id, true);
  }, []);

  const showPanel = useCallback((id: Project4HudPersistPanelId) => {
    setProject4HudPanelHidden(id, false);
  }, []);

  const togglePanel = useCallback((id: Project4HudPersistPanelId) => {
    toggleProject4HudPanelHidden(id);
  }, []);

  const isHidden = useCallback((id: Project4HudPersistPanelId) => hidden.has(id), [hidden]);

  return { hidePanel, showPanel, togglePanel, isHidden };
}
