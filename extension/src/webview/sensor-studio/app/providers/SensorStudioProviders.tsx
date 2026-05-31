import type { PropsWithChildren } from "react";

/**
 * Sensor Studio no longer mounts a separate asset registry — see {@link AssetRegistryProvider}
 * on {@link BitstreamShellMain}.
 */
export function SensorStudioProviders(props: PropsWithChildren) {
  return props.children;
}
