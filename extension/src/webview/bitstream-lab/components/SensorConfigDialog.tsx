/*******************************************************************************
 * File Name : SensorConfigDialog.tsx
 *
 * Description : Popup dialog to view/edit/apply BS2 SENSOR_CFG for all sensors.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useMemo, useState } from "react";
import { SENSOR_CFG_UI } from "../../bitstream-app/constants/sensorConfigUiLabels";
import { Settings2 } from "lucide-react";
import {
  TRNButton,
  TRNScrubNumberInput,
  TRNSegmentedControl,
  TRNToggleSwitch,
  TRNWindow,
} from "../../ui/TRN";
import { useBitstream2ReqAwait } from "../../shared/useBitstream2ReqAwait";
import { BS2_CMD } from "../../../bitstream2/domains/config/commands";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  normalizeSensorCfg,
  type Bs2PublishMode,
  type Bs2SensorConfig,
} from "../../../bitstream2/domains/config/sensor-config";
import { bytesToBase64 } from "../../../bitstream2/util/base64";
import { labSensorName } from "../lib/labSensorNames";
import { useLabWorkbenchShell } from "../workbench/lab-workbench-context";

const SENSOR_IDS: readonly number[] = [0, 1, 2, 3] as const;

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.trunc(n)));
}

function parseMask(raw: string): number | null {
  const v = raw.trim().toLowerCase();
  if (!v) return 0;
  const s = v.startsWith("0x") ? v.slice(2) : v;
  if (!/^[0-9a-f]+$/.test(s)) return null;
  const n = Number.parseInt(s, 16);
  if (!Number.isFinite(n)) return null;
  return clampByte(n);
}

type SensorRowDraft = Bs2SensorConfig & {
  maskText: string;
  dirty: boolean;
};

function toDraft(cfg: Bs2SensorConfig): SensorRowDraft {
  const c = normalizeSensorCfg(cfg);
  return {
    ...c,
    maskText: `0x${c.mask.toString(16).padStart(2, "0")}`,
    dirty: false,
  };
}

export function SensorConfigDialog(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;
  const { session, appendActivity } = useLabWorkbenchShell();
  const { sendReqAwait } = useBitstream2ReqAwait();

  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [rows, setRows] = useState<SensorRowDraft[]>([]);

  const canTalkToBridge = session.isConnected;

  const loadAll = useCallback(async () => {
    if (!canTalkToBridge) {
      setLastError("Connect WebSocket first.");
      return;
    }
    setBusy(true);
    setLastError(null);
    try {
      const next: SensorRowDraft[] = [];
      for (const sensorId of SENSOR_IDS) {
        const res = await sendReqAwait(
          {
            cmdId: BS2_CMD.SENSOR_CFG_GET,
            bodyB64: bytesToBase64(encodeSensorCfgGetBody(sensorId)),
            timeoutMs: 2000,
            requestId: `lab-sensor-cfg-get-${sensorId}-${Date.now()}`,
          },
          2200,
        );
        if (!res.ok) {
          throw new Error(`SENSOR_CFG_GET failed (id=${sensorId}, status=${res.status})`);
        }
        const cfg = decodeSensorCfgBody(res.body);
        if (!cfg) {
          throw new Error(`SENSOR_CFG_GET decode failed (id=${sensorId}, len=${res.body.byteLength})`);
        }
        next.push(toDraft(cfg));
      }
      setRows(next);
      appendActivity({ text: "Loaded SENSOR_CFG for all sensors", tone: "ok" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastError(msg);
      appendActivity({ text: `Load SENSOR_CFG failed: ${msg}`, tone: "error" });
    } finally {
      setBusy(false);
    }
  }, [appendActivity, canTalkToBridge, sendReqAwait]);

  const applyAll = useCallback(async () => {
    if (!canTalkToBridge) {
      setLastError("Connect WebSocket first.");
      return;
    }
    setBusy(true);
    setLastError(null);
    try {
      const nextRows: SensorRowDraft[] = [];
      for (const row of rows) {
        const cfg = normalizeSensorCfg({
          sensorId: row.sensorId,
          enabled: row.enabled,
          publishMode: row.publishMode,
          mask: row.mask,
          samplingIntervalMs: row.samplingIntervalMs,
          publishIntervalMs: row.publishIntervalMs,
          deltaX100: row.deltaX100,
          minPublishIntervalMs: row.minPublishIntervalMs,
        });
        const res = await sendReqAwait(
          {
            cmdId: BS2_CMD.SENSOR_CFG_SET,
            bodyB64: bytesToBase64(encodeSensorCfgBody(cfg)),
            timeoutMs: 2400,
            requestId: `lab-sensor-cfg-set-${cfg.sensorId}-${Date.now()}`,
          },
          2600,
        );
        if (!res.ok) {
          throw new Error(`SENSOR_CFG_SET failed (id=${cfg.sensorId}, status=${res.status})`);
        }
        const ackCfg = decodeSensorCfgBody(res.body);
        if (!ackCfg) {
          throw new Error(`SENSOR_CFG_SET ack decode failed (id=${cfg.sensorId}, len=${res.body.byteLength})`);
        }
        nextRows.push(toDraft(ackCfg));
      }
      // Reflect effective values (clamps) as returned by firmware/simulator.
      setRows(nextRows);
      appendActivity({ text: "Applied SENSOR_CFG to firmware", tone: "ok" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastError(msg);
      appendActivity({ text: `Apply SENSOR_CFG failed: ${msg}`, tone: "error" });
    } finally {
      setBusy(false);
    }
  }, [appendActivity, canTalkToBridge, rows, sendReqAwait]);

  useEffect(() => {
    if (!open) return;
    void loadAll();
  }, [loadAll, open]);

  const publishModeOptions = useMemo(
    () => [
      { value: "0", label: "Periodic" },
      { value: "1", label: "On change" },
      { value: "2", label: "Hybrid" },
    ],
    [],
  );

  return (
    <TRNWindow
      open={open}
      onClose={onClose}
      title="Sensor setup (BS2)"
      prefixIcon={<Settings2 className="size-4" aria-hidden />}
      initialRect={{ x: 80, y: 92, width: 860, height: 520 }}
      minWidth={640}
      minHeight={340}
      heightMode="auto"
      autoHeightMaxViewportFraction={0.92}
      modal={false}
      zIndex={420}
      contentClassName="min-h-0 overflow-y-auto bg-black/30 p-2"
      persistRectStorageKey="bitstream-lab:sensor-setup-window"
    >
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-zinc-300">
              View and edit <code className="text-zinc-200">SENSOR_CFG</code> for all sensors. Changes are applied via{" "}
              <code className="text-zinc-200">bitstream2/req</code> (UART and simulator loopback).
            </p>
            {!canTalkToBridge ? (
              <p className="mt-1 text-[11px] text-amber-300/90">Connect WebSocket in the Lab header first.</p>
            ) : null}
          </div>
          <div className="flex flex-row flex-wrap gap-2">
            <TRNButton size="compact" disabled={!canTalkToBridge || busy} onClick={() => void loadAll()}>
              Refresh
            </TRNButton>
            <TRNButton size="compact" selected disabled={!canTalkToBridge || busy || rows.length === 0} onClick={() => void applyAll()}>
              Apply all
            </TRNButton>
          </div>
        </div>

        {lastError ? <p className="text-[11px] text-rose-300/90">{lastError}</p> : null}

        <div className="min-h-0 overflow-auto rounded border border-zinc-800">
          <div className="grid min-w-232 grid-cols-12 gap-2 border-b border-zinc-800 bg-zinc-950/40 px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            <div className="col-span-2">Sensor</div>
            <div className="col-span-1">En</div>
            <div className="col-span-1">Mask</div>
            <div className="col-span-2">{SENSOR_CFG_UI.telemetryMode}</div>
            <div className="col-span-2">Sample ms</div>
            <div className="col-span-2">Telemetry ms</div>
            <div className="col-span-1">Δ×100</div>
            <div className="col-span-1">Min pub</div>
          </div>

          {rows.map((row) => (
            <div
              key={row.sensorId}
              className="grid min-w-232 grid-cols-12 items-center gap-2 border-b border-zinc-900 px-2 py-2 text-xs text-zinc-200 last:border-b-0"
            >
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-zinc-500">id={row.sensorId}</span>
                  <span className="text-xs text-zinc-100">{labSensorName(row.sensorId)}</span>
                  {row.dirty ? <span className="text-[10px] text-amber-300/90">•</span> : null}
                </div>
              </div>

              <div className="col-span-1">
                <TRNToggleSwitch
                  checked={row.enabled}
                  onCheckedChange={(v) =>
                    setRows((prev) =>
                      prev.map((r) => (r.sensorId === row.sensorId ? { ...r, enabled: v, dirty: true } : r)),
                    )
                  }
                />
              </div>

              <div className="col-span-1">
                <input
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-200"
                  value={row.maskText}
                  onChange={(e) => {
                    const nextText = e.target.value;
                    setRows((prev) =>
                      prev.map((r) => {
                        if (r.sensorId !== row.sensorId) return r;
                        const parsed = parseMask(nextText);
                        return {
                          ...r,
                          maskText: nextText,
                          mask: parsed == null ? r.mask : parsed,
                          dirty: true,
                        };
                      }),
                    );
                  }}
                  spellCheck={false}
                />
              </div>

              <div className="col-span-2">
                <TRNSegmentedControl
                  value={String(row.publishMode)}
                  onValueChange={(v) => {
                    const n = Number(v);
                    if (n !== 0 && n !== 1 && n !== 2) return;
                    setRows((prev) =>
                      prev.map((r) =>
                        r.sensorId === row.sensorId ? { ...r, publishMode: n as Bs2PublishMode, dirty: true } : r,
                      ),
                    );
                  }}
                  options={publishModeOptions}
                  size="sm"
                  variant="outline"
                  ariaLabel={SENSOR_CFG_UI.telemetryMode}
                />
              </div>

              <div className="col-span-2">
                <TRNScrubNumberInput
                  value={row.samplingIntervalMs}
                  onChange={(v) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.sensorId === row.sensorId ? { ...r, samplingIntervalMs: v, dirty: true } : r,
                      ),
                    )
                  }
                  fractionDigits={0}
                  step={1}
                  min={0}
                  max={65535}
                  pointerScrubEnabled={false}
                />
              </div>

              <div className="col-span-2">
                <TRNScrubNumberInput
                  value={row.publishIntervalMs}
                  onChange={(v) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.sensorId === row.sensorId ? { ...r, publishIntervalMs: v, dirty: true } : r,
                      ),
                    )
                  }
                  fractionDigits={0}
                  step={1}
                  min={0}
                  max={65535}
                  pointerScrubEnabled={false}
                />
              </div>

              <div className="col-span-1">
                <TRNScrubNumberInput
                  value={row.deltaX100}
                  onChange={(v) =>
                    setRows((prev) =>
                      prev.map((r) => (r.sensorId === row.sensorId ? { ...r, deltaX100: v, dirty: true } : r)),
                    )
                  }
                  fractionDigits={0}
                  step={1}
                  min={0}
                  max={65535}
                  pointerScrubEnabled={false}
                />
              </div>

              <div className="col-span-1">
                <TRNScrubNumberInput
                  value={row.minPublishIntervalMs}
                  onChange={(v) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.sensorId === row.sensorId ? { ...r, minPublishIntervalMs: v, dirty: true } : r,
                      ),
                    )
                  }
                  fractionDigits={0}
                  step={1}
                  min={0}
                  max={65535}
                  pointerScrubEnabled={false}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500">
          Notes: <code className="text-zinc-400">publishIntervalMs=0</code> means “use sampling interval”.
        </p>
      </div>
    </TRNWindow>
  );
}

