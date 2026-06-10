# Telemetry provider client (standalone)

Copy `BitstreamTelemetryClient.ts` into external React or vanilla apps.

```typescript
import { BitstreamTelemetryClient } from "./BitstreamTelemetryClient";

const client = new BitstreamTelemetryClient();
await client.connect();
client.on("sample", (sample) => console.log(sample.fields));
```

Regenerate from Bitstream Studio repo:

```bash
cd extension
npm run bitstream2:telemetry-catalog:gen
```

See [../SDK.md](../SDK.md) for full usage.
