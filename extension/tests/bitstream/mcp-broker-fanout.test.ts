import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Bs2BrokerSession } from "../../src/bitstream2/bridge/bs2-broker-session";
import type { BitstreamCommandApi } from "../../src/bitstream/command-api/bitstreamCommandApi";
import type { BitstreamCommandEnvelope } from "../../src/bitstream/command-api/bitstreamCommandTypes";
import {
  MCP_BROKER_FANOUT_INSTANCE_TOKEN,
  dispatchBrokerFanOutAfterMcpRunCommand,
  fanOutBmi270StreamModeAfterMcpGet,
  fanOutBmi270StreamModeAfterMcpSet,
  fanOutSensorCfgAfterMcpGet,
  fanOutVerifiedSensorCfgAfterMcpSet,
  publishSensorCfgUpdatedFanOut,
} from "../../src/bitstream/command-api/mcpBrokerFanOut";
import { SERIALPORT_TOPICS } from "../../src/serialport-bridge/protocol";

function sessionWithPublish(capture: { calls: Array<{ topic: string; payload: unknown }> }): Bs2BrokerSession {
  return {
    publishBrokerJson: async (topic: string, payload: unknown): Promise<void> => {
      capture.calls.push({ topic, payload });
    },
  } as unknown as Bs2BrokerSession;
}

describe("mcpBrokerFanOut", () => {
  it("publishSensorCfgUpdatedFanOut no-ops when publishBrokerJson is missing", async () => {
    const session = {} as Bs2BrokerSession;
    await publishSensorCfgUpdatedFanOut(
      session,
      {
        sourceId: 1,
        enabled: true,
        publishMode: 1,
        samplingIntervalMs: 200,
        deltaX100: 0,
        minPublishIntervalMs: 0,
      },
      "rid-1",
    );
  });

  it("publishSensorCfgUpdatedFanOut publishes sensor-cfg-updated with mcp instance token", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    await publishSensorCfgUpdatedFanOut(
      session,
      {
        sourceId: 3,
        enabled: false,
        publishMode: 2,
        samplingIntervalMs: 150,
        deltaX100: 10,
        minPublishIntervalMs: 5,
      },
      "verify-req-99",
    );
    assert.equal(capture.calls.length, 1);
    assert.equal(capture.calls[0]?.topic, SERIALPORT_TOPICS.SENSOR_CFG_UPDATED);
    const p = capture.calls[0]?.payload as Record<string, unknown>;
    assert.equal(p?.sourceId, 3);
    assert.equal(p?.enabled, false);
    assert.equal(p?.publishMode, 2);
    assert.equal(p?.requestId, "verify-req-99");
    assert.equal(p?.instanceToken, MCP_BROKER_FANOUT_INSTANCE_TOKEN);
    assert.equal(typeof p?.timestampMs, "number");
  });

  it("fanOutBmi270StreamModeAfterMcpSet no-ops when envelope is not successful bmi270 set", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    await fanOutBmi270StreamModeAfterMcpSet(session, {
      ok: false,
      type: "sensor.bmi270.mode.set",
      error: "fail",
    } as BitstreamCommandEnvelope);
    assert.equal(capture.calls.length, 0);
  });

  it("fanOutBmi270StreamModeAfterMcpSet maps modeEcho to UI stream mode and publishes", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    await fanOutBmi270StreamModeAfterMcpSet(session, {
      ok: true,
      type: "sensor.bmi270.mode.set",
      data: { modeEcho: 1 },
    } as BitstreamCommandEnvelope<"sensor.bmi270.mode.set">);
    assert.equal(capture.calls.length, 1);
    assert.equal(capture.calls[0]?.topic, SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED);
    const p = capture.calls[0]?.payload as Record<string, unknown>;
    assert.equal(p?.bmi270StreamMode, "fusion");
    assert.equal(p?.instanceToken, MCP_BROKER_FANOUT_INSTANCE_TOKEN);
  });

  it("fanOutBmi270StreamModeAfterMcpGet maps modeEcho to UI stream mode and publishes", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    await fanOutBmi270StreamModeAfterMcpGet(session, {
      ok: true,
      type: "sensor.bmi270.mode.get",
      data: { modeEcho: 2 },
    } as BitstreamCommandEnvelope<"sensor.bmi270.mode.get">);
    assert.equal(capture.calls.length, 1);
    assert.equal(capture.calls[0]?.topic, SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED);
    const p = capture.calls[0]?.payload as Record<string, unknown>;
    assert.equal(p?.bmi270StreamMode, "hybrid");
    assert.equal(p?.instanceToken, MCP_BROKER_FANOUT_INSTANCE_TOKEN);
  });

  it("fanOutVerifiedSensorCfgAfterMcpSet skips when normalized command is not sensor.cfg.set", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    const api = {
      async execute() {
        assert.fail("execute should not run");
      },
    } as unknown as BitstreamCommandApi;
    await fanOutVerifiedSensorCfgAfterMcpSet(session, api, { type: "handshake.run", payload: {} });
    assert.equal(capture.calls.length, 0);
  });

  it("fanOutVerifiedSensorCfgAfterMcpSet verifies via sensor.cfg.get and fans out", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    const api = {
      async execute(cmd: { type: string; payload: { sourceId: number } }) {
        assert.equal(cmd.type, "sensor.cfg.get");
        assert.equal(cmd.payload.sourceId, 2);
        return {
          ok: true,
          data: {
            sourceId: 2,
            enabled: true,
            publishMode: 1,
            samplingIntervalMs: 100,
            deltaX100: 7,
            minPublishIntervalMs: 20,
          },
        };
      },
    } as unknown as BitstreamCommandApi;
    await fanOutVerifiedSensorCfgAfterMcpSet(session, api, {
      type: "sensor.cfg.set",
      payload: { options: { sourceId: 2 } },
    });
    assert.equal(capture.calls.length, 1);
    assert.equal(capture.calls[0]?.topic, SERIALPORT_TOPICS.SENSOR_CFG_UPDATED);
    const p = capture.calls[0]?.payload as Record<string, unknown>;
    assert.equal(p?.sourceId, 2);
    assert.equal(p?.deltaX100, 7);
  });

  it("fanOutVerifiedSensorCfgAfterMcpSet accepts string sourceId in options (LLM JSON)", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    const api = {
      async execute(cmd: { type: string; payload: { sourceId: number } }) {
        assert.equal(cmd.type, "sensor.cfg.get");
        assert.equal(cmd.payload.sourceId, 3);
        return {
          ok: true,
          data: {
            sourceId: 3,
            enabled: true,
            publishMode: 1,
            samplingIntervalMs: 50,
            deltaX100: 0,
            minPublishIntervalMs: 0,
          },
        };
      },
    } as unknown as BitstreamCommandApi;
    await fanOutVerifiedSensorCfgAfterMcpSet(session, api, {
      type: "sensor.cfg.set",
      payload: { options: { sourceId: "3" } },
    });
    assert.equal(capture.calls.length, 1);
    const p = capture.calls[0]?.payload as Record<string, unknown>;
    assert.equal(p?.samplingIntervalMs, 50);
  });

  it("fanOutSensorCfgAfterMcpGet publishes current cfg for no-op/read flows", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    await fanOutSensorCfgAfterMcpGet(session, {
      ok: true,
      type: "sensor.cfg.get",
      requestId: "get-req-1",
      data: {
        sourceId: 4,
        enabled: true,
        publishMode: 1,
        samplingIntervalMs: 500,
        deltaX100: 0,
        minPublishIntervalMs: 0,
      },
    } as BitstreamCommandEnvelope<"sensor.cfg.get">);
    assert.equal(capture.calls.length, 1);
    assert.equal(capture.calls[0]?.topic, SERIALPORT_TOPICS.SENSOR_CFG_UPDATED);
    const p = capture.calls[0]?.payload as Record<string, unknown>;
    assert.equal(p?.sourceId, 4);
    assert.equal(p?.publishMode, 1);
    assert.equal(p?.samplingIntervalMs, 500);
    assert.equal(p?.requestId, "get-req-1");
  });

  it("dispatchBrokerFanOutAfterMcpRunCommand runs sensor cfg verify then bmi270 fan-out", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    const api = {
      async execute(cmd: { type: string }) {
        if (cmd.type === "sensor.cfg.get") {
          return {
            ok: true,
            data: {
              sourceId: 1,
              enabled: true,
              publishMode: 1,
              samplingIntervalMs: 200,
              deltaX100: 0,
              minPublishIntervalMs: 0,
            },
          };
        }
        return { ok: false };
      },
    } as unknown as BitstreamCommandApi;
    await dispatchBrokerFanOutAfterMcpRunCommand(
      session,
      api,
      { type: "sensor.cfg.set", payload: { options: { sourceId: 1 } } },
      {
        ok: true,
        type: "sensor.bmi270.mode.set",
        data: { modeEcho: 0 },
      } as BitstreamCommandEnvelope<"sensor.bmi270.mode.set">,
    );
    assert.equal(capture.calls.length, 2);
    assert.equal(capture.calls[0]?.topic, SERIALPORT_TOPICS.SENSOR_CFG_UPDATED);
    assert.equal(capture.calls[1]?.topic, SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED);
    const bmi = capture.calls[1]?.payload as Record<string, unknown>;
    assert.equal(bmi?.bmi270StreamMode, "raw");
  });

  it("dispatchBrokerFanOutAfterMcpRunCommand fans out sensor cfg on direct MCP get", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    const api = {
      async execute() {
        assert.fail("sensor.cfg.set verification should not run for direct sensor.cfg.get command");
      },
    } as unknown as BitstreamCommandApi;
    await dispatchBrokerFanOutAfterMcpRunCommand(
      session,
      api,
      { type: "sensor.cfg.get", payload: { sourceId: 4 } },
      {
        ok: true,
        type: "sensor.cfg.get",
        requestId: "direct-get-rid",
        data: {
          sourceId: 4,
          enabled: true,
          publishMode: 1,
          samplingIntervalMs: 500,
          deltaX100: 0,
          minPublishIntervalMs: 0,
        },
      } as BitstreamCommandEnvelope<"sensor.cfg.get">,
    );
    assert.equal(capture.calls.length, 1);
    assert.equal(capture.calls[0]?.topic, SERIALPORT_TOPICS.SENSOR_CFG_UPDATED);
    const p = capture.calls[0]?.payload as Record<string, unknown>;
    assert.equal(p?.requestId, "direct-get-rid");
    assert.equal(p?.publishMode, 1);
  });

  it("dispatchBrokerFanOutAfterMcpRunCommand fans out BMI270 mode on direct MCP get", async () => {
    const capture = { calls: [] as Array<{ topic: string; payload: unknown }> };
    const session = sessionWithPublish(capture);
    const api = {
      async execute() {
        assert.fail("sensor.cfg.set verification should not run for direct sensor.bmi270.mode.get command");
      },
    } as unknown as BitstreamCommandApi;
    await dispatchBrokerFanOutAfterMcpRunCommand(
      session,
      api,
      { type: "sensor.bmi270.mode.get", payload: {} },
      {
        ok: true,
        type: "sensor.bmi270.mode.get",
        data: { modeEcho: 1 },
      } as BitstreamCommandEnvelope<"sensor.bmi270.mode.get">,
    );
    assert.equal(capture.calls.length, 1);
    assert.equal(capture.calls[0]?.topic, SERIALPORT_TOPICS.BMI270_STREAM_MODE_UPDATED);
    const p = capture.calls[0]?.payload as Record<string, unknown>;
    assert.equal(p?.bmi270StreamMode, "fusion");
  });
});
