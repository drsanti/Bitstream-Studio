import type { BitstreamCommandDefinition } from "./command-types";

export const HELLO_REQ: BitstreamCommandDefinition = {
  name: "HELLO_REQ",
  channel: 0x03,
  commandId: 0x01,
};

export const PING_REQ: BitstreamCommandDefinition = {
  name: "PING_REQ",
  channel: 0x03,
  commandId: 0x02,
};

export const CAPS_REQ: BitstreamCommandDefinition = {
  name: "CAPS_REQ",
  channel: 0x03,
  commandId: 0x03,
};

export const STATUS_REQ: BitstreamCommandDefinition = {
  name: "STATUS_REQ",
  channel: 0x03,
  commandId: 0x04,
};

export const STREAM_PAUSE_REQ: BitstreamCommandDefinition = {
  name: "STREAM_PAUSE_REQ",
  channel: 0x03,
  commandId: 0x0e,
};

export const STREAM_RESUME_REQ: BitstreamCommandDefinition = {
  name: "STREAM_RESUME_REQ",
  channel: 0x03,
  commandId: 0x0f,
};

export const LOG_LEVEL_GET_REQ: BitstreamCommandDefinition = {
  name: "LOG_LEVEL_GET_REQ",
  channel: 0x03,
  commandId: 0x0c,
};

export const LOG_LEVEL_SET_REQ: BitstreamCommandDefinition = {
  name: "LOG_LEVEL_SET_REQ",
  channel: 0x03,
  commandId: 0x0d,
};
