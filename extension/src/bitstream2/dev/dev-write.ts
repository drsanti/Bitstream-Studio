/**
 * Dev-mode serial write policy: optional real UART + external bitstream-simulator.
 */

export type DevSerialWriteDeps = {
  data: Uint8Array;
  portOpen: boolean;
  /** Route host TX to external sim via broker (auto-detected or forced). */
  useExternalSim: boolean;
  writeToPort: (data: Uint8Array) => Promise<void>;
  feedExternalSim: (data: Uint8Array) => void | Promise<void>;
};

export async function applyDevSerialWrite(deps: DevSerialWriteDeps): Promise<void> {
  const { data, portOpen, useExternalSim, writeToPort, feedExternalSim } = deps;

  if (portOpen) {
    await writeToPort(data);
  }

  if (useExternalSim) {
    await feedExternalSim(data);
    return;
  }

  if (!portOpen) {
    throw new Error(
      "Serial port is not open. Start the bitstream-simulator extension (or BITSTREAM2_EXTERNAL_SIM=1) for host-only simulation.",
    );
  }
}
