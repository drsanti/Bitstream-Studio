import { SensorStudioMain } from "./SensorStudioMain";
import { SensorStudioProviders } from "./providers/SensorStudioProviders";

export function SensorStudioApp() {
  return (
    <SensorStudioProviders>
      <SensorStudioMain />
    </SensorStudioProviders>
  );
}
