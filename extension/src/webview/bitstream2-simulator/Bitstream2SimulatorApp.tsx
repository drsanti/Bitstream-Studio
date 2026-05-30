import { SimDevToolbar } from "./components/SimDevToolbar";
import { FirmwareParamsPanel } from "./components/FirmwareParamsPanel";
import { SensorDataPanel } from "./components/SensorDataPanel";
import { SimulatorSensorTestPanel } from "./components/SimulatorSensorTestPanel";
import { SimLinkBar } from "./components/SimLinkBar";
import { useBitstream2SimulatorFeed } from "./hooks/useBitstream2SimulatorFeed";

/**
 * Self-contained BS firmware simulator dashboard.
 * Consumes broker JSON only (`bitstream2/*`, serial status).
 */
export function Bitstream2SimulatorApp() {
  const feed = useBitstream2SimulatorFeed();

  return (
    <div className="t3d-shell-overlay pointer-events-auto h-full w-full overflow-y-auto bg-zinc-950/40 p-4 text-zinc-100">
      <SimLinkBar
        isConnected={feed.isConnected}
        devStatus={feed.devStatus}
        sampleCount={feed.sampleCount}
        serialStatus={feed.serialStatus}
        firmwareLiveness={feed.firmwareLiveness}
        lastError={feed.lastError}
      />

      {!feed.devStatus?.loopbackEnabled ? (
        <p className="mt-3 rounded-md border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-sm text-amber-100/90">
          Start the{" "}
          <code className="rounded bg-black/30 px-1">bitstream-simulator</code> extension and{" "}
          <code className="rounded bg-black/30 px-1">npm run start:bridge</code>
          . Real UART is optional — WebSocket carries BS traffic.
        </p>
      ) : null}

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0">
        <FirmwareParamsPanel
          simState={feed.simState}
          hello={feed.hello}
          metrics={feed.metrics}
          sendPing={feed.sendPing}
          refreshCfg={feed.refreshCfg}
          applyCfg={feed.applyCfg}
          cfgApplyBySensorId={feed.cfgApplyBySensorId}
        />
        </div>
        <div className="min-w-0">
        <SensorDataPanel
          samplesBySensor={feed.samplesBySensor}
          sampleHistory={feed.sampleHistory}
          simState={feed.simState}
        />
        </div>
      </div>

      <div className="mt-4">
        <SimulatorSensorTestPanel
          isConnected={feed.isConnected}
          loopbackEnabled={feed.devStatus?.loopbackEnabled ?? false}
          simState={feed.simState}
        />
      </div>

      <div className="mt-4">
        <SimDevToolbar />
      </div>
    </div>
  );
}
