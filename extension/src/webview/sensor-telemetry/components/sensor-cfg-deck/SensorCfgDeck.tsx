/*******************************************************************************
 * Embeddable SENSOR_CFG control deck for one hardware source id.
 ******************************************************************************/

import { BMI270ControlPanel } from "../../../bitstream-app/components/bmi270/BMI270ControlPanel.js";
import { BMM350ControlPanel } from "../../../bitstream-app/components/bmm350/BMM350ControlPanel.js";
import { DPS368ControlPanel } from "../../../bitstream-app/components/dps368/DPS368ControlPanel.js";
import { SHT40ControlPanel } from "../../../bitstream-app/components/sht40/SHT40ControlPanel.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../bitstream-app/constants/sensorSourceIds.js";
import type { Bmi270AckState } from "../../../bitstream-app/components/bmi270/types.js";
import {
  ackForSensorSource,
  asSensorPublishMode,
  type SensorCfgPanelHost,
} from "../../lib/sensorCfgPanelHost.js";

const IDLE_FUSION_FEED_ACK: Bmi270AckState = { state: "idle" };

export type SensorCfgDeckProps = {
  sourceId: number;
  host: SensorCfgPanelHost;
  /** When true, edits stay draft until per-card or bar Apply (Telemetry + Inspector). */
  draftUntilApply?: boolean;
  className?: string;
};

export function SensorCfgDeck(props: SensorCfgDeckProps) {
  const { sourceId, host, draftUntilApply = true, className } = props;

  const row = host.rowForSource(sourceId);
  if (row == null) {
    return (
      <p className="text-[11px] leading-relaxed text-zinc-500">
        No verified device row yet. Connect transport and use Refresh to load firmware config.
      </p>
    );
  }

  const publishMode = asSensorPublishMode(row.publishMode);
  const ack = ackForSensorSource(host.sensorConfigAck, sourceId);
  const shared = {
    enabled: row.enabled,
    dataRateMs: row.samplingIntervalMs,
    publishMode,
    deltaX100: row.deltaX100,
    minPublishIntervalMs: row.minPublishIntervalMs,
    ack,
    ackSensorSourceId: sourceId,
    draftUntilApply,
    ...host.cardApplyProps,
  };

  const deck = (() => {
    switch (sourceId) {
      case SENSOR_SOURCE_ID_BMI270:
        return (
          <BMI270ControlPanel
            {...shared}
            onEnabledChange={(v) => host.setSensorConfig(SENSOR_SOURCE_ID_BMI270, { enabled: v })}
            onSamplingFrequencyChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_BMI270, { samplingIntervalMs: v })
            }
            onPublishModeChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_BMI270, { publishMode: v })
            }
            onDeltaX100Change={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_BMI270, { deltaX100: v })
            }
            onMinPublishIntervalMsChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_BMI270, { minPublishIntervalMs: v })
            }
            fusionFeedIntervalMs={host.fusionFeedIntervalMs}
            onFusionFeedIntervalChange={host.onFusionFeedChange}
            fusionFeedAck={IDLE_FUSION_FEED_ACK}
            mask={row.mask}
            onMaskChange={host.onBmi270MaskChange}
          />
        );
      case SENSOR_SOURCE_ID_DPS368:
        return (
          <DPS368ControlPanel
            {...shared}
            onEnabledChange={(v) => host.setSensorConfig(SENSOR_SOURCE_ID_DPS368, { enabled: v })}
            onSamplingFrequencyChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_DPS368, { samplingIntervalMs: v })
            }
            onPublishModeChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_DPS368, { publishMode: v })
            }
            onDeltaX100Change={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_DPS368, { deltaX100: v })
            }
            onMinPublishIntervalMsChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_DPS368, { minPublishIntervalMs: v })
            }
          />
        );
      case SENSOR_SOURCE_ID_SHT40:
        return (
          <SHT40ControlPanel
            {...shared}
            onEnabledChange={(v) => host.setSensorConfig(SENSOR_SOURCE_ID_SHT40, { enabled: v })}
            onSamplingFrequencyChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_SHT40, { samplingIntervalMs: v })
            }
            onPublishModeChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_SHT40, { publishMode: v })
            }
            onDeltaX100Change={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_SHT40, { deltaX100: v })
            }
            onMinPublishIntervalMsChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_SHT40, { minPublishIntervalMs: v })
            }
          />
        );
      case SENSOR_SOURCE_ID_BMM350:
        return (
          <BMM350ControlPanel
            {...shared}
            onEnabledChange={(v) => host.setSensorConfig(SENSOR_SOURCE_ID_BMM350, { enabled: v })}
            onSamplingFrequencyChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_BMM350, { samplingIntervalMs: v })
            }
            onPublishModeChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_BMM350, { publishMode: v })
            }
            onDeltaX100Change={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_BMM350, { deltaX100: v })
            }
            onMinPublishIntervalMsChange={(v) =>
              host.setSensorConfig(SENSOR_SOURCE_ID_BMM350, { minPublishIntervalMs: v })
            }
          />
        );
      default:
        return (
          <p className="text-[11px] text-zinc-500">
            No configuration deck for source id {sourceId}.
          </p>
        );
    }
  })();

  return className != null ? <div className={className}>{deck}</div> : deck;
}
