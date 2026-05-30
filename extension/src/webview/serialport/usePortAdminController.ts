import { useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import type { PortInfo } from "../../serialport-bridge/protocol";
import { listSerialPortDetails } from "../../bitstream/services/serial-port-details-service";
import { openUartPortAndHandshake } from "../bitstream-app/bridge/openUartPortAndHandshake";
import { useBitstreamConfigStore } from "../bitstream-app/state/bitstreamConfig.store";
import {
  orderSerialPortsForDisplay,
  pickPreferredSerialPortPath,
} from "../bitstream-app/utils/pickPreferredSerialPortPath";
import { useSerialPortStore } from "./serial-port-store";
import { useWsClientStore } from "../ws-client-store";
import { usePortAdminStore } from "./port-admin.store";

export function usePortAdminController()
{
  const wsUrl = useWsClientStore((s) => s.wsUrl);
  const isWsConnected = useWsClientStore((s) => s.isConnected);
  const connectionState = useWsClientStore((s) => s.connectionState);

  const isOpen = usePortAdminStore((s) => s.isOpen);
  const selectedPath = usePortAdminStore((s) => s.selectedPath);
  const ports = usePortAdminStore((s) => s.ports);
  const loading = usePortAdminStore((s) => s.loading);
  const error = usePortAdminStore((s) => s.error);
  const lastUpdatedAt = usePortAdminStore((s) => s.lastUpdatedAt);
  const open = usePortAdminStore((s) => s.open);
  const close = usePortAdminStore((s) => s.close);
  const setSelectedPath = usePortAdminStore((s) => s.setSelectedPath);
  const setPorts = usePortAdminStore((s) => s.setPorts);
  const setLoading = usePortAdminStore((s) => s.setLoading);
  const setError = usePortAdminStore((s) => s.setError);
  const detailsViewMode = usePortAdminStore((s) => s.detailsViewMode);
  const setDetailsViewMode = usePortAdminStore((s) => s.setDetailsViewMode);

  const serialPath = useBitstreamConfigStore((s) => s.serialPath);
  const whitelistedSerialPaths = useBitstreamConfigStore((s) => s.whitelistedSerialPaths);
  const serialPortDisplayOrder = useBitstreamConfigStore((s) => s.serialPortDisplayOrder);
  const toggleWhitelistedSerialPath = useBitstreamConfigStore((s) => s.toggleWhitelistedSerialPath);
  const setSerialPortDisplayOrder = useBitstreamConfigStore((s) => s.setSerialPortDisplayOrder);
  const syncSerialPortDisplayOrderWithAvailable = useBitstreamConfigStore(
    (s) => s.syncSerialPortDisplayOrderWithAvailable,
  );
  const setSerialPath = useBitstreamConfigStore((s) => s.setSerialPath);

  const refreshPorts = useCallback(async () =>
  {
    setLoading(true);
    setError(null);
    try
    {
      const list = await listSerialPortDetails({ wsUrl, timeoutMs: 4000 });
      setPorts(list);
      syncSerialPortDisplayOrderWithAvailable(list.map((port) => port.path));
    }
    catch (e)
    {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    }
    finally
    {
      setLoading(false);
    }
  }, [setError, setLoading, setPorts, syncSerialPortDisplayOrderWithAvailable, wsUrl]);

  useEffect(() =>
  {
    if (!isOpen)
    {
      return;
    }
    const target = serialPath.trim();
    if (target.length > 0)
    {
      setSelectedPath(target);
    }
    void refreshPorts();
  }, [isOpen, refreshPorts, serialPath, setSelectedPath]);

  const orderedPorts = useMemo(
    () => orderSerialPortsForDisplay(ports, serialPortDisplayOrder),
    [ports, serialPortDisplayOrder],
  );

  const autoConnectPick = useMemo(
    () =>
      pickPreferredSerialPortPath({
        availablePaths: ports.map((port) => port.path),
        preferredPath: serialPath,
        whitelistedPaths: whitelistedSerialPaths,
        displayOrder: serialPortDisplayOrder,
      }),
    [ports, serialPath, whitelistedSerialPaths, serialPortDisplayOrder],
  );

  const selectedPort = useMemo(
    () => ports.find((port) => port.path === selectedPath) ?? null,
    [ports, selectedPath],
  );

  const reorderPorts = useCallback(
    (nextPaths: string[]) =>
    {
      setSerialPortDisplayOrder(nextPaths);
    },
    [setSerialPortDisplayOrder],
  );

  const useThisPort = useCallback(
    async (path: string) =>
    {
      const normalized = path.trim();
      if (normalized.length === 0)
      {
        return;
      }

      setSerialPath(normalized);
      setSelectedPath(normalized);
      useSerialPortStore.getState().setSelectedPath(normalized);

      if (!isWsConnected)
      {
        toast.info(`Target port set to ${normalized}. Connect WebSocket to open COM.`);
        return;
      }

      try
      {
        await openUartPortAndHandshake({ forceFullBringUp: true });
        toast.success(`Using ${normalized}`);
      }
      catch (e)
      {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(`Could not open ${normalized}: ${message}`);
      }
    },
    [isWsConnected, setSelectedPath, setSerialPath],
  );

  const isWhitelisted = useCallback(
    (path: string) => whitelistedSerialPaths.includes(path),
    [whitelistedSerialPaths],
  );

  return {
    wsUrl,
    isWsConnected,
    connectionState,
    isOpen,
    selectedPath,
    serialPath,
    autoConnectPick,
    whitelistedSerialPaths,
    serialPortDisplayOrder,
    selectedPort,
    ports,
    orderedPorts,
    loading,
    error,
    lastUpdatedAt,
    open,
    close,
    setSelectedPath,
    refreshPorts,
    toggleWhitelistedSerialPath,
    reorderPorts,
    useThisPort,
    isWhitelisted,
    detailsViewMode,
    setDetailsViewMode,
  };
}

export type PortAdminOrderedPort = PortInfo;
