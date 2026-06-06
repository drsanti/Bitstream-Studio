import { useCallback, useEffect } from "react";
import { useQuickActionStore } from "./quick-action-store.js";
import type { Command } from "./types.js";

export interface UseQuickActionReturn
{
  registerCommand: (command: Command) => void;
  unregisterCommand: (id: string) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Register Ctrl+/ quick-action commands. Import from here in bitstream-app / sensor-studio.
 */
export function useQuickAction(
  callback?: (api: UseQuickActionReturn) => void | (() => void),
): UseQuickActionReturn
{
  const registerCommand = useQuickActionStore((state) => state.registerCommand);
  const unregisterCommand = useQuickActionStore(
    (state) => state.unregisterCommand,
  );
  const setOpen = useQuickActionStore((state) => state.setOpen);
  const toggle = useQuickActionStore((state) => state.toggle);

  const open = useCallback(() => setOpen(true), [setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);

  const api: UseQuickActionReturn = {
    registerCommand,
    unregisterCommand,
    open,
    close,
    toggle,
  };

  useEffect(() =>
  {
    if (!callback)
    {
      return;
    }
    const cleanup = callback(api);
    return cleanup;
  }, []);

  return api;
}
