/*******************************************************************************
 * File Name : TelemetryConfigPanel.tsx
 *
 * Description : Left workbench pane — tabbed sensor cfg cards (draft + Apply bar).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.3
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useState } from "react";
import {
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  trnInspectorTabActiveClassName,
} from "../../../ui/TRN";
import { useBitstreamAppControl } from "../../../bitstream-app/control/bitstreamAppControl.context.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../bitstream-app/constants/sensorSourceIds.js";
import { useBitstreamConfigStore } from "../../../bitstream-app/state/bitstreamConfig.store.js";
import { appendTelemetryActivity } from "../../store/telemetryActivity.store.js";
import { SensorCfgTabTrigger } from "../SensorCfgTabTrigger.js";
import {
  isConfigPaneSensorTabDirty,
  listConfigPaneDirtySourceIds,
} from "../../lib/configPaneDirty.js";
import { sensorCfgApplyBarAck } from "../../lib/sensorCfgApplyBarAck.js";
import { getSensorSourceDisplayLabel } from "../../../bitstream-app/constants/sensorSourceIds.js";
import { useSensorCfgPanelHost } from "../../lib/sensorCfgPanelHost.js";
import { SensorCfgDeck } from "../sensor-cfg-deck/SensorCfgDeck.js";
import { SensorCfgApplyBar } from "./SensorCfgApplyBar.js";

function dirtyLabelsFromIds(ids: number[]): string {
  return ids.map((id) => getSensorSourceDisplayLabel(id)).join(", ");
}

/**
 * Per-sensor configuration cards; edits stay draft until Apply.
 */
export function TelemetryConfigPanel() {
  const { sensorConfigAck, isSensorCfgDirty } = useBitstreamAppControl();

  const host = useSensorCfgPanelHost({
    onActivity: (text, tone) => appendTelemetryActivity({ text, tone }),
  });

  const [activeSensorTab, setActiveSensorTab] = useState<
    "bmi270" | "dps368" | "sht40" | "bmm350"
  >("bmi270");

  const onApply = useCallback(() => {
    const dirtyIds = listConfigPaneDirtySourceIds();
    const labels = dirtyLabelsFromIds(dirtyIds);
    void host.runApplyScope({ kind: "global" }).then((res) => {
      if (!res.ok) {
        appendTelemetryActivity({
          text: res.error ?? "Sensor config apply failed",
          tone: "error",
        });
        return;
      }
      const mode = useBitstreamConfigStore.getState().bmi270StreamMode;
      appendTelemetryActivity({
        text:
          labels.length > 0
            ? `Applied sensor config: ${labels} (BMI270 output ${mode})`
            : `Sensor config applied to board (BMI270 output ${mode})`,
        tone: "ok",
      });
    });
  }, [host]);

  const applyAck = sensorCfgApplyBarAck(sensorConfigAck);

  const tabContentClass = "mt-0 min-h-0 flex-1 overflow-y-auto px-1 pb-1";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={
          host.canControl ? "min-h-0 flex-1" : "pointer-events-none min-h-0 flex-1 opacity-50"
        }
      >
        <TRNTabs
          value={activeSensorTab}
          onValueChange={(next) => {
            if (
              next === "bmi270" ||
              next === "dps368" ||
              next === "sht40" ||
              next === "bmm350"
            ) {
              setActiveSensorTab(next);
            }
          }}
          lazyMount
          className="flex h-full min-h-0 flex-col"
          activeTriggerClassName={trnInspectorTabActiveClassName(
            activeSensorTab,
            activeSensorTab,
          )}
        >
          <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
            <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
              <SensorCfgTabTrigger
                value="bmi270"
                label="BMI270"
                dirty={isConfigPaneSensorTabDirty(
                  SENSOR_SOURCE_ID_BMI270,
                  isSensorCfgDirty(SENSOR_SOURCE_ID_BMI270),
                )}
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
              />
              <SensorCfgTabTrigger
                value="dps368"
                label="DPS368"
                dirty={isConfigPaneSensorTabDirty(
                  SENSOR_SOURCE_ID_DPS368,
                  isSensorCfgDirty(SENSOR_SOURCE_ID_DPS368),
                )}
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
              />
              <SensorCfgTabTrigger
                value="sht40"
                label="SHT40"
                dirty={isConfigPaneSensorTabDirty(
                  SENSOR_SOURCE_ID_SHT40,
                  isSensorCfgDirty(SENSOR_SOURCE_ID_SHT40),
                )}
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
              />
              <SensorCfgTabTrigger
                value="bmm350"
                label="BMM350"
                dirty={isConfigPaneSensorTabDirty(
                  SENSOR_SOURCE_ID_BMM350,
                  isSensorCfgDirty(SENSOR_SOURCE_ID_BMM350),
                )}
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
              />
            </TRNTabsList>
          </div>

          <TRNTabsContent value="bmi270" keepMounted={false} className={tabContentClass}>
            <SensorCfgDeck
              sourceId={SENSOR_SOURCE_ID_BMI270}
              host={host}
              draftUntilApply
            />
          </TRNTabsContent>

          <TRNTabsContent value="dps368" keepMounted={false} className={tabContentClass}>
            <SensorCfgDeck
              sourceId={SENSOR_SOURCE_ID_DPS368}
              host={host}
              draftUntilApply
            />
          </TRNTabsContent>

          <TRNTabsContent value="sht40" keepMounted={false} className={tabContentClass}>
            <SensorCfgDeck
              sourceId={SENSOR_SOURCE_ID_SHT40}
              host={host}
              draftUntilApply
            />
          </TRNTabsContent>

          <TRNTabsContent value="bmm350" keepMounted={false} className={tabContentClass}>
            <SensorCfgDeck
              sourceId={SENSOR_SOURCE_ID_BMM350}
              host={host}
              draftUntilApply
            />
          </TRNTabsContent>
        </TRNTabs>
      </div>

      <SensorCfgApplyBar
        canControl={host.canControl}
        busy={host.busy}
        onRefresh={host.onRefresh}
        onRevert={host.onRevertAll}
        onApply={onApply}
        applyAck={applyAck}
      />
    </div>
  );
}
