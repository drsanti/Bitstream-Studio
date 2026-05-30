# Bitstream Lab — WebSocket broker observability

**Agent handoff:** See **`RUNBOOK.md`** (phases 0–3 done; this panel is phase **5**).

Inspect the **T3D WebSocket broker** (`T3DWebSocketServer`, default `ws://127.0.0.1:9998`): connected **clients**, **topics**, **subscriptions**, and **traffic**.

Related code:

| Piece | Path |
|-------|------|
| Broker server | `src/websocket/T3DWebSocketServer.ts` |
| Monitor events | `src/websocket/broker-monitor-events.ts` → topic **`t3d/broker/monitor`** |
| Config | `src/websocket/T3DWebSocketConfig.ts` (`T3D_WS_MONITOR_PUBLISHES`, port **9998** / model **9999**) |
| Lab WS client | `src/webview/ws-client-store.ts` (bytes in/out for **this** webview only) |
| Product UI (do not import in Lab) | `bitstream-app/system-tools/SystemWebsocketActivity.tsx` |

Lab must **reimplement or extract** monitor aggregation under `bitstream-lab/` (isolation). Allowed shared import: **`broker-monitor-events.ts`** types only.

---

## UI placement

Expand workbench pane **`broker`** → **`BrokerObservabilityPanel`** with **TRNTabs** (same pattern as `protocol`):

```text
┌─ Broker ─────────────────── [ Overview | Clients | Topics | Traffic | Events ] ─┐
│  (active sub-view)                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Not** a 9th registry pane — keeps **8** workbench entries (`broker` becomes rich; `tap` stays raw JSON).

---

## Sub-views (ASCII)

### **Overview**

Server-level picture (mix of monitor replay + optional snapshot API).

```text
│ Broker URL [ ws://127.0.0.1:9998 ▾ ]  Lab: ● connected  role=webview          │
├────────────────────────────────────────────────────────────────────────────────┤
│ Server (Phase B snapshot)          │ This Lab client (always)                 │
│   Running: yes                     │   RX: 12.4 MB   TX: 89 KB                │
│   Uptime: 01:23:45                 │   Subscriptions: 14 json, 2 binary       │
│   Connections: 3                   │   Identity: bitstream-lab                │
│   Topics (distinct): 22            │   [ Send client hello ]                  │
│   Msgs RX/TX (broker): 4.2M / 4.1M │                                          │
├────────────────────────────────────────────────────────────────────────────────┤
│ Monitor feed: ● live   [ ] Include message-published (high volume)             │
│ Hint: set T3D_WS_MONITOR_PUBLISHES=0 on broker to reduce publish rows          │
└────────────────────────────────────────────────────────────────────────────────┘
```

### **Clients**

Live table rebuilt from monitor events (`client-connected`, `identified`, `disconnected`).

```text
│ Filter [ name/role contains… ]     Sort: connected ▾   [ Export CSV ]          │
├──────────┬────────────────────┬──────────┬─────────┬──────────────────────────┤
│ Session  │ Identity           │ Connected│ Subs    │ Last activity            │
│ c-abc…   │ bridge · serial    │ 12m ago  │ 18      │ publish bitstream2/…     │
│ c-def…   │ webview · lab      │ now      │ 16      │ subscribe serialport/…   │
│ c-ghi…   │ webview · bitstream│ 8m ago   │ 24      │ publish evt/sensor       │
└──────────┴────────────────────┴──────────┴─────────┴──────────────────────────┘
```

Click row → side detail: json subs list, binary subs list, connection time, meta from `hello`.

### **Topics**

Subscription + traffic matrix (from monitor + publish rows).

```text
│ Group [ bitstream2/ ▾ ]   Show: [x] json  [x] binary  [x] zero-traffic        │
├────────────────────────────┬──────┬──────┬─────────┬──────────┬───────────────┤
│ Topic                      │ Subs │ Pub/s│ Lab RX/s│ Lab TX/s │ Last publisher│
│ bitstream2/evt/sensor      │  2   │ 80   │ 80      │ 0        │ bridge        │
│ bitstream2/metrics         │  3   │ 1    │ 1       │ 0        │ bridge        │
│ serialport/status          │  2   │ 0.2  │ 0.2     │ 0        │ bridge        │
│ bitstream2/req             │  1   │ 0.1  │ 0       │ 0.1      │ lab           │
│ t3d/broker/monitor         │  1   │ 5    │ 5       │ 0        │ (telemetry)   │
└────────────────────────────┴──────┴──────┴─────────┴──────────┴───────────────┘
```

**Subs** = distinct clients with `subscription-added` minus `subscription-removed` (replay buffer; see limits below).

**Pub/s** = rate of `message-published` for that topic (requires monitor publishes enabled).

**Lab RX/TX** = from `useWsClientStore` listeners for **this** tab only (not other clients).

### **Traffic**

Time-series and top talkers.

```text
│ Window [ 60s ▾ ]                                                              │
├────────────────────────────────────────────────────────────────────────────────┤
│ Sparkline: broker publish events/s (all clients) │ Lab WS bytes/s RX │ TX      │
├────────────────────────────────────────────────────────────────────────────────┤
│ Top topics by volume (broker publish count, 60s)                               │
│   1. bitstream2/evt/sensor        4,800/s                                      │
│   2. serialport/data              1,200/s   (if publishes on — noisy)          │
│   3. bitstream2/metrics               1/s                                      │
├────────────────────────────────────────────────────────────────────────────────┤
│ QoS breakdown (Lab client publishes):  qos0: 99%  qos1: 1%  qos2: 0%           │
└────────────────────────────────────────────────────────────────────────────────┘
```

Optional filter: hide `serialport/data` unless “show raw UART” checked (same env as `T3D_WS_MONITOR_PUBLISHES`).

### **Events**

Same semantics as **`SystemWebsocketActivity`** (kind filters, 500-row ring, table).

```text
│ [x] connect [x] disconnect [x] identify [x] sub+ [x] sub− [x] publish        │
│ [ Pause ] [ Clear ]                                                            │
├──────────┬─────────────────┬──────────────────────────────────────────────────┤
│ Time     │ Kind            │ Detail                                           │
│ 12:01:01 │ client-connected│ session=c-abc…                                     │
│ 12:01:02 │ subscription…   │ c-abc → bitstream2/hello (json)                  │
│ 12:01:03 │ message-published│ bitstream2/evt/sensor json qos=0 bridge…        │
└──────────┴─────────────────┴──────────────────────────────────────────────────┘
```

---

## Data sources

### Already available (Phase A — no broker code change)

| Signal | How Lab gets it |
|--------|------------------|
| Connect/disconnect/identify/sub | Subscribe **`t3d/broker/monitor`**, parse `BrokerMonitorEnvelope` |
| Per-topic publish rate | `kind === "message-published"` (if `brokerMonitorIncludePublishes: true`, default in `T3D_DEFAULT_SERVER_CONFIG`) |
| Lab byte counters | `useWsClientStore` → `wsBytesReceived`, `wsBytesSent` |
| Lab subscriptions | `addSubscribeListener` / `addUnsubscribeListener` on ws store |
| Lab identity | On connect, send WS `{ type: "hello", role: "webview", name: "bitstream-lab", instance: … }` |

Hook: **`useLabBrokerMonitor.ts`** — subscribes monitor topic once (`bitstream-lab-broker-monitor`), maintains:

- `clientsById: Map<sessionId, LabBrokerClientRow>`
- `topicsByName: Map<string, LabBrokerTopicRow>`
- `eventRing: BrokerMonitorEnvelope[]`
- `trafficWindow: SlidingCounter`

Reuse aggregation ideas from `computeMonitorSessionStats` in `SystemWebsocketActivity.tsx` but **copy into** `bitstream-lab/lib/broker-monitor-aggregate.ts` (no import from `bitstream-app`).

### Phase B — broker snapshot (recommended for “all details”)

Add periodic JSON on **`t3d/broker/snapshot`** (qos 0, only to clients subscribed to monitor or snapshot):

```ts
export type BrokerSnapshotPayload = {
  atMs: number;
  status: ServerStatus; // running, uptime, connections, messagesReceived/Sent, topics count
  clients: Array<{
    id: string;
    connectedAt: number;
    identity?: T3DWsClientIdentity;
    jsonSubscriptions: string[];
    binarySubscriptions: string[];
  }>;
  topics: Array<{
    topic: string;
    jsonSubscribers: number;
    binarySubscribers: number;
  }>;
};
```

Publish from `T3DWebSocketServer` every **1s** when `broadcastBrokerEvents` and at least one monitor/snapshot subscriber (cheap; client list is small).

Lab **Overview** and **Clients/Topics** prefer snapshot when fresh (`atMs` &lt; 2s); fall back to monitor replay.

### Phase C — optional HTTP admin (out of scope unless needed)

`GET http://127.0.0.1:9997/status` — only if VSIX security allows; not required if Phase B exists.

---

## Limits (document in UI)

| Limit | Explanation |
|-------|-------------|
| **Buffer replay** | Client/sub counts derived from last **N** monitor events (e.g. 2000), not full server state — stale if buffer trimmed |
| **Other clients’ bytes** | Broker does not expose per-client byte counts today — only **Lab** RX/TX + publish **event counts** |
| **High volume** | `serialport/data` + `message-published` can flood Events/Traffic — filter off by default |
| **Second broker** | Model loader uses **port 9999** — Lab URL selector should offer preset `ws://127.0.0.1:9999` |

---

## Client `hello` (identify Lab on broker)

On Lab connect, after WS open:

```json
{
  "type": "hello",
  "role": "webview",
  "name": "bitstream-lab",
  "instance": "<optional tab id>",
  "meta": { "app": "bitstream-lab" }
}
```

Bridge uses e.g. `role: "bridge", name: "serialport"`. Makes **Clients** table readable.

---

## Implementation files

```
bitstream-lab/
  hooks/
    useLabBrokerMonitor.ts      # monitor subscription + aggregates
    useLabWsTraffic.ts          # lab-only bytes + per-topic RX/TX
  lib/
    broker-monitor-aggregate.ts # clients/topics/stats from envelopes
    broker-traffic-window.ts    # Hz, bytes/s
  components/panels/
    BrokerObservabilityPanel.tsx
    broker/                     # sub-views (optional split files)
      BrokerOverviewTab.tsx
      BrokerClientsTab.tsx
      BrokerTopicsTab.tsx
      BrokerTrafficTab.tsx
      BrokerEventsTab.tsx
```

Replace thin **`BrokerPanel`** stub in README with **`BrokerObservabilityPanel`**.

---

## Phases

| Phase | Deliverable |
|-------|-------------|
| **B1** | Subscribe `t3d/broker/monitor`; **Events** tab + **Overview** pills (buffer stats) |
| **B2** | **Clients** + **Topics** tables from aggregate |
| **B3** | **Traffic** sparklines + Lab `wsBytes*` / per-topic lab counters |
| **B4** | Broker **`t3d/broker/snapshot`** + authoritative Overview/Clients/Topics |
| **B5** | CSV export, second broker preset (9999), link to `websocket/ARCHITECTURE.md` |

---

## Testing

- [ ] `npm run start:bridge` → Lab sees bridge client + bitstream topics.
- [ ] Open second webview → **Clients** shows 2+ sessions after connect.
- [ ] Disable publishes: `T3D_WS_MONITOR_PUBLISHES=0` → Events quiet except connect/sub; Topics pub/s = 0.
- [ ] Lab RX/TX increases when `evt/sensor` flows; matches order of magnitude vs Topic Tap.
- [ ] With Phase B: snapshot clients match `getClientList()` from Node REPL / server logs.

---

## Relation to other Lab panes

| Pane | Focus |
|------|--------|
| **Broker** (this doc) | MQTT-style **broker** fabric |
| **Topic Tap** | Every message **payload** (JSON/binary) |
| **Protocol** | BS **UART** frames after bridge decode |
| **Activity** | Human **actions** (connect COM, ping, …) |
