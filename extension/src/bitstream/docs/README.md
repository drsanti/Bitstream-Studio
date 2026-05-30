# Bitstream Docs Index

This folder contains the design and usage documentation for the `bitstream` protocol library.

## Documents

- [Transport-Agnostic Architecture](./TRANSPORT_AGNOSTIC_PROTOCOL_ARCHITECTURE.md)
  - System architecture, module boundaries, portability constraints, and rollout plan.

- [Frame Protocol Specification](./FRAME_PROTOCOL_SPECIFICATION.md)
  - Wire format, channels, command and ACK mapping, parsing rules, validation, and examples. **In-document navigation:** [Table of contents](./FRAME_PROTOCOL_SPECIFICATION.md#table-of-contents) · [§1.1 Byte-level reference map](./FRAME_PROTOCOL_SPECIFICATION.md#11-byte-level-reference-map).

- [Bitstream User Manual](./BITSTREAM_USER_MANUAL.md)
  - Practical usage guide, adapter contract, quick start, migration checklist, troubleshooting, and **extension webview** topics (serial port list, persistence, host JSON mirror, Port Admin) in **§14–§15**.

- [Diagnostics task stream protocol](./DIAG_TASK_STREAM_PROTOCOL.md)
  - `diag.task.table.get`, task stream configuration, batch markers, and parsing notes.

- [Bitstream developer runbook](./BITSTREAM_DEVELOPER_RUNBOOK.md)
  - How to run the broker/bridge, execute CLI probes, recommended ACK budgets, and multi-client test checklists.

- [StreamSight Reference Sync](./STREAMSIGHT_REFERENCE_SYNC.md)
  - Drift detection workflow and lock-file process to keep protocol behavior aligned with StreamSight.

## Recommended Reading Order

1. [Transport-Agnostic Architecture](./TRANSPORT_AGNOSTIC_PROTOCOL_ARCHITECTURE.md)
2. [Frame Protocol Specification](./FRAME_PROTOCOL_SPECIFICATION.md) — start from the [table of contents](./FRAME_PROTOCOL_SPECIFICATION.md#table-of-contents) when jumping to sections
3. [Bitstream User Manual](./BITSTREAM_USER_MANUAL.md)
4. [StreamSight Reference Sync](./STREAMSIGHT_REFERENCE_SYNC.md)

## Related

- [Bitstream package README](../README.md)
- [Bitstream app demos README](../../webview/bitstream-app/README.md)
- [Project bridge overview](../../../docs/BRIDGE.md)
