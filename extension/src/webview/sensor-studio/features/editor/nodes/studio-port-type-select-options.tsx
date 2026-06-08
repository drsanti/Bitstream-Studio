import type { TRNSelectOption } from "../../../../ui/TRN";
import type { StudioPortType } from "../flow-graph-types";
import { formatFlowPortTypeLabel } from "../edges/flow-edge-port-label";
import { StudioPortTypeMenuIcon } from "./studio-port-type-menu-icon";

/** {@link TRNSelect} rows — colored icon badge + human label. */
export function buildStudioPortTypeSelectOptions(
  portTypes: readonly StudioPortType[],
): TRNSelectOption[] {
  return portTypes.map((portType) => ({
    value: portType,
    label: formatFlowPortTypeLabel(portType),
    icon: <StudioPortTypeMenuIcon portType={portType} />,
  }));
}
