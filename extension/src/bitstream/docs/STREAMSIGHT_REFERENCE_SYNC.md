# StreamSight Reference Sync

This module tracks protocol drift against the reference project:

- Reference project root:
  - D:/CODE/2026/TESAIoT_PSoC_Edge_Workspace/StreamSight

## Why This Exists

Bitstream behavior in this repository should stay compatible with StreamSight backend protocol changes. If StreamSight protocol files change, we need a fast way to detect drift and decide whether to update `src/bitstream`.

## Tracked Reference Files

The sync script currently tracks these files from StreamSight:

- packages/backend/src/protocol/bitstreamBuilder.ts
- packages/backend/src/protocol/bitstreamParser.ts
- packages/backend/src/protocol/handshake.ts
- packages/backend/src/serial/serialPortManager.ts
- docs/ARCHITECTURE.md
- docs/SYSTEM_DIAGNOSTICS_TYPE_0X05_SPEC.md

Current lock file in this repository:

- src/bitstream/docs/streamsight-reference-lock.json

## Commands

Check for drift:

```bash
node scripts/check-streamsight-bitstream-sync.js
```

Update lock file after accepting upstream changes:

```bash
node scripts/check-streamsight-bitstream-sync.js --update
```

Override reference root temporarily:

```bash
STREAMSIGHT_REFERENCE_ROOT="D:/custom/path/StreamSight" node scripts/check-streamsight-bitstream-sync.js
```

## Expected Workflow

1. Run drift check before bitstream protocol changes.
2. If drift is reported, review changed reference files.
3. Update bitstream code/docs in this repository.
4. Re-run check and update lock only when synchronization is complete.

## Notes

- The script compares SHA-256 hashes for deterministic drift detection.
- Missing tracked files are treated as drift.
- Lock updates should be committed together with any related bitstream updates.
