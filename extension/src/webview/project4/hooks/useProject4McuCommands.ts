import { useCallback, useState } from "react";
import {
  sendProject4Move,
  sendProject4SetSpeed,
  type Project4MoveDirection,
} from "../lib/mcu-http";
import { useProject4SettingsStore } from "../settings/project4-settings.store";

export function useProject4McuCommands(): {
  sendMove: (dir: Project4MoveDirection) => Promise<boolean>;
  sendSetSpeed: (val: number) => Promise<boolean>;
  moveBusy: boolean;
  speedBusy: boolean;
  lastFault: string | null;
  clearFault: () => void;
} {
  const [moveBusy, setMoveBusy] = useState(false);
  const [speedBusy, setSpeedBusy] = useState(false);
  const [lastFault, setLastFault] = useState<string | null>(null);

  const sendMove = useCallback(async (dir: Project4MoveDirection): Promise<boolean> => {
    const settings = useProject4SettingsStore.getState();
    setMoveBusy(true);
    try {
      const res = await sendProject4Move(settings, dir);
      if (!res.ok) {
        setLastFault(`move HTTP ${res.status}`);
        return false;
      }
      setLastFault(null);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastFault(msg);
      return false;
    } finally {
      setMoveBusy(false);
    }
  }, []);

  const sendSetSpeed = useCallback(async (val: number): Promise<boolean> => {
    const settings = useProject4SettingsStore.getState();
    setSpeedBusy(true);
    try {
      const res = await sendProject4SetSpeed(settings, val);
      if (!res.ok) {
        setLastFault(`setSpeed HTTP ${res.status}`);
        return false;
      }
      setLastFault(null);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastFault(msg);
      return false;
    } finally {
      setSpeedBusy(false);
    }
  }, []);

  const clearFault = useCallback(() => setLastFault(null), []);

  return { sendMove, sendSetSpeed, moveBusy, speedBusy, lastFault, clearFault };
}
