import assert from "node:assert/strict";
import test from "node:test";
import type { Bitstream2HostResPayload } from "../../src/bitstream2/bridge/protocol";
import { BS2_CMD } from "../../src/bitstream2/domains/config/commands";
import { encodeSensorCfgBody } from "../../src/bitstream2/domains/config/sensor-config";
import { SHT40_MASK } from "../../src/bitstream2/domains/sensors/sht40";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";
import {
  executeProviderCommand,
  PROVIDER_COMMAND_ALLOWLIST,
} from "../../src/bitstream2/telemetry-provider/provider-command-handlers";
import { ProviderCommandService } from "../../src/bitstream2/telemetry-provider/provider-command-service";
import { bytesToBase64 } from "../../src/bitstream2/util/base64";

test("provider command allowlist includes R1 names", () => {
  assert.ok(PROVIDER_COMMAND_ALLOWLIST.includes("ping"));
  assert.ok(PROVIDER_COMMAND_ALLOWLIST.includes("sensor.cfg.get"));
  assert.ok(PROVIDER_COMMAND_ALLOWLIST.includes("bmi270.mode.set"));
});

test("executeProviderCommand rejects unknown commands", async () => {
  const service = new ProviderCommandService({
    publishReq: async () => {},
    onRes: () => () => {},
  });
  const result = await executeProviderCommand(service, "danger.delete", {});
  service.dispose();
  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /not allowlisted/);
});

test("executeProviderCommand maps sensor.cfg.get RES to provider row", async () => {
  const published: Array<{ cmdId: number; requestId: string }> = [];
  const service = new ProviderCommandService({
    publishReq: async (req) => {
      published.push({ cmdId: req.cmdId, requestId: req.requestId });
      const res: Bitstream2HostResPayload = {
        requestId: req.requestId,
        ok: true,
        cmdId: req.cmdId,
        status: 0,
        bodyB64: bytesToBase64(
          encodeSensorCfgBody({
            sensorId: BS2_SENSOR_ID.SHT40,
            enabled: true,
            publishMode: 2,
            mask: SHT40_MASK.TEMP | SHT40_MASK.HUM,
            samplingIntervalMs: 500,
            publishIntervalMs: 0,
            deltaX100: 50,
            minPublishIntervalMs: 0,
          }),
        ),
        atMs: Date.now(),
      };
      service.noteRes(res);
    },
    onRes: () => () => {},
  });

  const result = await executeProviderCommand(service, "sensor.cfg.get", {
    sensor: "sht40",
  });
  service.dispose();

  assert.equal(result.ok, true);
  assert.equal(published[0]?.cmdId, BS2_CMD.SENSOR_CFG_GET);
  assert.equal((result.data as { sensor?: string }).sensor, "sht40");
});
