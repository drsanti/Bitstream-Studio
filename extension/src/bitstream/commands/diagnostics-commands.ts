import type { BitstreamCommandDefinition } from "./command-types";

export const DIAG_GET_SNAPSHOT_REQ: BitstreamCommandDefinition = {
  name: "DIAG_GET_SNAPSHOT_REQ",
  channel: 0x05,
  commandId: 0x01,
};

export const DIAG_STREAM_START_REQ: BitstreamCommandDefinition = {
  name: "DIAG_STREAM_START_REQ",
  channel: 0x05,
  commandId: 0x02,
};

export const DIAG_STREAM_STOP_REQ: BitstreamCommandDefinition = {
  name: "DIAG_STREAM_STOP_REQ",
  channel: 0x05,
  commandId: 0x03,
};

export const DIAG_GET_TASK_TABLE_REQ: BitstreamCommandDefinition = {
  name: "DIAG_GET_TASK_TABLE_REQ",
  channel: 0x05,
  commandId: 0x04,
};

export const DIAG_SET_TASK_PRIORITY_REQ: BitstreamCommandDefinition = {
  name: "DIAG_SET_TASK_PRIORITY_REQ",
  channel: 0x05,
  commandId: 0x10,
};

export const DIAG_TASK_STREAM_CONFIG_SET_REQ: BitstreamCommandDefinition = {
  name: "DIAG_TASK_STREAM_CONFIG_SET_REQ",
  channel: 0x05,
  commandId: 0x20,
};

export const DIAG_TASK_STREAM_FILTER_BEGIN_REQ: BitstreamCommandDefinition = {
  name: "DIAG_TASK_STREAM_FILTER_BEGIN_REQ",
  channel: 0x05,
  commandId: 0x21,
};

export const DIAG_TASK_STREAM_FILTER_CHUNK_REQ: BitstreamCommandDefinition = {
  name: "DIAG_TASK_STREAM_FILTER_CHUNK_REQ",
  channel: 0x05,
  commandId: 0x22,
};

export const DIAG_TASK_STREAM_FILTER_COMMIT_REQ: BitstreamCommandDefinition = {
  name: "DIAG_TASK_STREAM_FILTER_COMMIT_REQ",
  channel: 0x05,
  commandId: 0x23,
};

export const DIAG_TASK_STREAM_RESYNC_NOW_REQ: BitstreamCommandDefinition = {
  name: "DIAG_TASK_STREAM_RESYNC_NOW_REQ",
  channel: 0x05,
  commandId: 0x24,
};
