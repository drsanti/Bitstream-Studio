import mqtt from "mqtt";
import * as fs from "node:fs";
import * as path from "node:path";

function loadDotEnvIfPresent(): void {
  // Minimal .env loader (no external deps). Intended for local smoke tests only.
  // Loads from: <repo>/t3d-extension/src/mqtt-node/.env
  try {
    const envPath = path.resolve(__dirname, ".env");
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (!key) continue;
      // strip optional quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      // don't overwrite already-provided env
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (e) {
    console.warn("[mqtt-test] .env load failed:", e);
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v.trim();
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const v = raw.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "y") return true;
  if (v === "0" || v === "false" || v === "no" || v === "n") return false;
  return fallback;
}

type TlsMode = "node" | "strict";

function envTlsMode(): TlsMode {
  const raw = (process.env.T3D_MQTT_TLS_MODE || "").trim().toLowerCase();
  if (raw === "strict" || raw === "browser") return "strict";
  return "node";
}

function buildBrokerUrl(host: string, port: number, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `wss://${host}:${port}${normalizedPath}`;
}

function tryReadFile(filePath: string): string | undefined {
  try {
    if (!filePath.trim()) return undefined;
    const p = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(p)) return undefined;
    return fs.readFileSync(p, "utf8");
  } catch {
    return undefined;
  }
}

async function main(): Promise<void> {
  loadDotEnvIfPresent();
  const host = process.env.T3D_MQTT_HOST?.trim() || "mqtt.tesaiot.com";
  const port = envInt("T3D_MQTT_PORT", 8085);
  const path = process.env.T3D_MQTT_PATH?.trim() || "/mqtt";

  const username = requireEnv("T3D_MQTT_USERNAME");
  const password = requireEnv("T3D_MQTT_PASSWORD");
  const clientId = process.env.T3D_MQTT_CLIENT_ID?.trim() || username;
  const tlsMode = envTlsMode();
  const rejectUnauthorized =
    tlsMode === "strict" ? true : envBool("T3D_MQTT_REJECT_UNAUTHORIZED", false);
  const caFile = process.env.T3D_MQTT_CA_FILE?.trim() || "";
  const ca = tlsMode === "strict" ? undefined : caFile ? tryReadFile(caFile) : undefined;

  const brokerUrl = buildBrokerUrl(host, port, path);
  const topic =
    process.env.T3D_MQTT_TEST_TOPIC?.trim() || `device/${username}/telemetry`;

  console.log("[mqtt-test] brokerUrl:", brokerUrl);
  console.log("[mqtt-test] clientId:", clientId);
  console.log("[mqtt-test] username:", username);
  console.log("[mqtt-test] topic:", topic);
  console.log("[mqtt-test] tlsMode:", tlsMode);
  console.log("[mqtt-test] rejectUnauthorized:", rejectUnauthorized);
  console.log("[mqtt-test] caFile:", caFile ? caFile : "(none)");
  if (tlsMode === "strict") {
    const extra = (process.env.NODE_EXTRA_CA_CERTS || "").trim();
    if (!extra) {
      console.warn(
        "[mqtt-test] strict TLS mode enabled. Node does NOT use the Windows trust store.\n" +
          "[mqtt-test] To emulate browser/webview trust, set NODE_EXTRA_CA_CERTS to the TESAIoT CA chain PEM.\n" +
          '[mqtt-test] Example (bash): export NODE_EXTRA_CA_CERTS="../docs/ca-chain.pem"'
      );
    } else {
      console.log("[mqtt-test] NODE_EXTRA_CA_CERTS:", extra);
    }
  }

  const client = mqtt.connect(brokerUrl, {
    clientId,
    username,
    password,
    clean: true,
    keepalive: 60,
    reconnectPeriod: 0, // smoke test: do not loop forever
    connectTimeout: 15000,
    protocolVersion: 5,
    rejectUnauthorized,
    ...(ca ? { ca } : {}),
  });

  const deadline = setTimeout(() => {
    console.error("[mqtt-test] ❌ timeout waiting for connect");
    try {
      client.end(true);
    } finally {
      process.exitCode = 2;
    }
  }, 20000);

  client.once("connect", () => {
    console.log("[mqtt-test] ✅ connected");
    client.subscribe(topic, { qos: 0 }, (err) => {
      if (err) {
        console.error("[mqtt-test] ❌ subscribe error:", err.message);
        clearTimeout(deadline);
        client.end(true, () => {
          process.exitCode = 3;
        });
        return;
      }

      const payload = JSON.stringify({
        ts: new Date().toISOString(),
        ok: true,
        source: "t3d-extension/src/mqtt-node/test-mqtt-wss.ts",
      });

      client.publish(topic, payload, { qos: 0 }, (pubErr) => {
        clearTimeout(deadline);
        if (pubErr) {
          console.error("[mqtt-test] ❌ publish error:", pubErr.message);
          client.end(true, () => {
            process.exitCode = 4;
          });
          return;
        }
        console.log("[mqtt-test] ✅ published");
        client.end(true, () => {
          console.log("[mqtt-test] ✅ disconnected");
        });
      });
    });
  });

  client.once("error", (err) => {
    clearTimeout(deadline);
    console.error("[mqtt-test] ❌ error:", err?.message || String(err));
    client.end(true, () => {
      process.exitCode = 1;
    });
  });

  // MQTT v5 server DISCONNECT packet with reasonCode (e.g. 142 = Session taken over)
  (client as any).on?.("disconnect", (packet: any) => {
    const reasonCode = packet?.reasonCode;
    if (typeof reasonCode === "number") {
      console.warn("[mqtt-test] ⚠️ server disconnect reasonCode:", reasonCode);
      if (reasonCode === 142) {
        console.warn(
          "[mqtt-test] Session taken over (142): another client is connected with the same clientId/deviceId."
        );
      }
    }
  });

  client.on("message", (t, msg) => {
    console.log("[mqtt-test] 📨 message:", t, msg.toString());
  });
}

void main();

