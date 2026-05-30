import React, { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useSerialPort } from "./useSerialPort";
import {
  buildCommandLine,
  getCommand,
  getParamsForCommand,
} from "../cli-commands";
import {
  OutputPanel,
  CommandList,
  ParameterForm,
  ConfirmDialog,
} from "../ui/components/mcu-cli";

const MAX_LINES = 100;
const decoder = new TextDecoder("utf-8", { fatal: false });

export function McuCliPanel() {
  const [streamLines, setStreamLines] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"text" | "hex">("text");
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const [selectedSubcommandId, setSelectedSubcommandId] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCommandId, setConfirmCommandId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const onData = useCallback((chunk: Uint8Array, encoding?: string) => {
    if (!encoding) return;
    const line = decoder.decode(chunk);
    if (!line) return;
    setStreamLines((prev) => [...prev, line].slice(-MAX_LINES));
  }, []);

  const {
    connectionState,
    status,
    listPorts,
    openPort,
    closePort,
    write,
    connect,
    disconnect,
    isConnected,
    ports,
    wsUrl,
    selectedPath,
    baudRate,
    setWsUrl,
    setSelectedPath,
    setBaudRate,
  } = useSerialPort("cli", onData);

  const handleListPorts = useCallback(async () => {
    try {
      const list = await listPorts();
      if (list.length > 0 && !selectedPath) setSelectedPath(list[0]!.path);
    } catch (e) {
      console.error("List ports failed:", e);
    }
  }, [listPorts, selectedPath, setSelectedPath]);

  const handleConnect = useCallback(async () => {
    try {
      await connect();
      await handleListPorts();
    } catch (e) {
      console.error("Connect failed:", e);
    }
  }, [connect, handleListPorts]);

  const handleOpen = useCallback(async () => {
    try {
      await openPort({
        path: selectedPath,
        baudRate,
        mode: "line",
        readlineDelimiter: "\n",
      });
      setStreamLines((prev) => [...prev, `[Opened ${selectedPath} @ ${baudRate}]`]);
    } catch (e) {
      console.error("Open failed:", e);
    }
  }, [openPort, selectedPath, baudRate]);

  const handleClose = useCallback(async () => {
    try {
      await closePort();
      setStreamLines((prev) => [...prev, "[Closed]"]);
    } catch (e) {
      console.error("Close failed:", e);
    }
  }, [closePort]);

  const runCommand = useCallback(
    async (cmdLine: string) => {
      if (!status?.isOpen) return;
      setSending(true);
      try {
        await write(cmdLine + "\n");
      } catch (e) {
        const msg = (e as Error).message;
        console.error("Write failed:", e);
        setStreamLines((prev) => [...prev, `[Error: ${msg}]`]);
        toast.error(`Send failed: ${msg}`);
      } finally {
        setSending(false);
      }
    },
    [status?.isOpen, write]
  );

  const handleRunNoParam = useCallback(
    (cmdId: string) => {
      const cmd = getCommand(cmdId);
      if (!cmd?.destructive) {
        const line = buildCommandLine(cmdId, selectedCommandId === cmdId ? selectedSubcommandId : null, {});
        runCommand(line);
      }
    },
    [selectedCommandId, selectedSubcommandId, runCommand]
  );

  const handleDestructive = useCallback((cmdId: string) => {
    setConfirmCommandId(cmdId);
    setConfirmOpen(true);
  }, []);

  const handleConfirmDestructive = useCallback(() => {
    if (confirmCommandId) {
      runCommand(confirmCommandId);
      setConfirmOpen(false);
      setConfirmCommandId(null);
    }
  }, [confirmCommandId, runCommand]);

  const handleParameterSubmit = useCallback(() => {
    if (!selectedCommandId) return;
    const line = buildCommandLine(
      selectedCommandId,
      selectedSubcommandId,
      paramValues
    );
    runCommand(line);
  }, [selectedCommandId, selectedSubcommandId, paramValues, runCommand]);

  const selectedCmd = selectedCommandId ? getCommand(selectedCommandId) : undefined;
  const hasParams = selectedCmd
    ? (getParamsForCommand(selectedCmd, selectedSubcommandId)?.length ?? 0) > 0
    : false;

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full p-6 gap-4 overflow-hidden">
      <h1 className="text-2xl font-bold shrink-0">MCU CLI</h1>

      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-4 shrink-0">
          <CommandList
            selectedCommandId={selectedCommandId}
            selectedSubcommandId={selectedSubcommandId}
            onSelectCommand={setSelectedCommandId}
            onSelectSubcommand={setSelectedSubcommandId}
            portOpen={!!status?.isOpen}
            onRun={(cmdId) => {
              const cmd = getCommand(cmdId);
              if (cmd?.destructive) handleDestructive(cmdId);
              else handleRunNoParam(cmdId);
            }}
          />
          {hasParams && (
            <ParameterForm
              commandId={selectedCommandId}
              subcommandId={selectedSubcommandId}
              values={paramValues}
              onChange={(key, value) =>
                setParamValues((prev) => ({ ...prev, [key]: value }))
              }
              onSubmit={handleParameterSubmit}
              disabled={!status?.isOpen}
              sending={sending}
            />
          )}
        </div>
        <div className="min-h-0 flex flex-col flex-1">
          <OutputPanel
            lines={streamLines}
            onClear={() => setStreamLines([])}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm"
        message="This will reset/reboot the device. Continue?"
        confirmLabel={confirmCommandId === "reset" ? "Reset" : "Reboot"}
        onConfirm={handleConfirmDestructive}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmCommandId(null);
        }}
        variant="danger"
      />
    </div>
  );
}
