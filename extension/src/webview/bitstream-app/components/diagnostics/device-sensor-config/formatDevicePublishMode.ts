/**
 * Human-readable label for firmware `publishMode` (SENSOR_CFG), for read-only parameter panels.
 */
export function formatDevicePublishModeLabel(publishMode: number): string
{
  if (publishMode === 0)
  {
    return "Periodic";
  }
  if (publishMode === 1)
  {
    return "On change";
  }
  if (publishMode === 2)
  {
    return "Hybrid";
  }
  return `Unknown (${publishMode})`;
}
