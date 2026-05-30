import type { PropsWithChildren } from "react";
import { StudioAssetDescriptorsProvider } from "../../features/asset-browser/useStudioAssetDescriptors";

/**
 * Root provider container for Sensor Studio.
 * Keep this minimal for now; expand when stores/runtime context are added.
 */
export function SensorStudioProviders(props: PropsWithChildren) {
  const { children } = props;
  return <StudioAssetDescriptorsProvider>{children}</StudioAssetDescriptorsProvider>;
}
