import { useEffect, useRef } from 'react';
import { useWsClientStore } from '../ws-client-store';
import { useSerialPortStore, type SerialDataHandler } from './serial-port-store';

/**
 * Convenience hook wrapping the shared serial-port Zustand store.
 *
 * - Connection state (`connectionState`, `isConnected`, `wsUrl`, `setWsUrl`)
 *   comes from the shared ws-client-store.
 * - Serial-specific state and actions come from serial-port-store.
 * - Automatically registers / unregisters a data subscriber identified by
 *   `subscriberId` so the component receives serial data via `onData`.
 */
export function useSerialPort(subscriberId: string, onData?: SerialDataHandler) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const connectionState = useWsClientStore((s) => s.connectionState);
  const isConnected = useWsClientStore((s) => s.isConnected);
  const wsUrl = useWsClientStore((s) => s.wsUrl);
  const setWsUrl = useWsClientStore((s) => s.setWsUrl);

  const status = useSerialPortStore((s) => s.status);
  const ports = useSerialPortStore((s) => s.ports);
  const selectedPath = useSerialPortStore((s) => s.selectedPath);
  const baudRate = useSerialPortStore((s) => s.baudRate);
  const mode = useSerialPortStore((s) => s.mode);

  const setSelectedPath = useSerialPortStore((s) => s.setSelectedPath);
  const setBaudRate = useSerialPortStore((s) => s.setBaudRate);
  const setMode = useSerialPortStore((s) => s.setMode);
  const connect = useSerialPortStore((s) => s.connect);
  const disconnect = useSerialPortStore((s) => s.disconnect);
  const listPorts = useSerialPortStore((s) => s.listPorts);
  const openPort = useSerialPortStore((s) => s.openPort);
  const closePort = useSerialPortStore((s) => s.closePort);
  const write = useSerialPortStore((s) => s.write);

  useEffect(() => {
    if (!onDataRef.current) return;

    const handler: SerialDataHandler = (chunk, encoding) => {
      onDataRef.current?.(chunk, encoding);
    };

    useSerialPortStore.getState().subscribe(subscriberId, handler);
    return () => {
      useSerialPortStore.getState().unsubscribe(subscriberId);
    };
  }, [subscriberId]);

  return {
    connectionState,
    isConnected,
    status,
    ports,
    wsUrl,
    selectedPath,
    baudRate,
    mode,

    setWsUrl,
    setSelectedPath,
    setBaudRate,
    setMode,
    connect,
    disconnect,
    listPorts,
    openPort,
    closePort,
    write,
  };
}
