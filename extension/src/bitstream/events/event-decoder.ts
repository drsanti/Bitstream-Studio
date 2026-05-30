import { BITSTREAM_CHANNEL_SENSOR, type BitstreamFrame } from "../frame/frame-types";
import type { BitstreamEvent, BitstreamEventName } from "./event-types";
import { decodeBitstreamSensorSample } from "./sensor-decoder";

function mapEventName(channel: number, eventId: number): BitstreamEventName {
  if (channel === 0x03) {
    switch (eventId) {
      case 0x81:
        return "HELLO_ACK";
      case 0x82:
        return "PING_ACK";
      case 0x83:
        return "CAPS_ACK";
      case 0x84:
        return "STATUS_ACK";
      case 0x85:
        return "SENSOR_CFG_GET_ACK";
      case 0x86:
        return "SENSOR_CFG_SET_ACK";
      case 0x87:
        return "SENSOR_REINIT_ACK";
      case 0x88:
        return "BMI270_MODE_SET_ACK";
      case 0x8a:
        return "BMI270_FUSION_FEED_ACK";
      default:
        return "UNKNOWN";
    }
  }

  if (channel === 0x05 && eventId === 0x80) {
    return "DIAG_ACK";
  }

  return "UNKNOWN";
}

export function decodeBitstreamEvent(frame: BitstreamFrame): BitstreamEvent {
  if (frame.channel === BITSTREAM_CHANNEL_SENSOR) {
    const sensorSample = decodeBitstreamSensorSample(frame);
    return {
      name: sensorSample ? "SENSOR_SAMPLE_V2" : "UNKNOWN",
      channel: frame.channel,
      eventId: 0,
      sequence: frame.sequence,
      payload: frame.payload,
      sensorSample: sensorSample ?? undefined,
    };
  }

  const eventId = frame.payload[0] ?? 0;
  return {
    name: mapEventName(frame.channel, eventId),
    channel: frame.channel,
    eventId,
    sequence: frame.sequence,
    payload: frame.payload,
  };
}
