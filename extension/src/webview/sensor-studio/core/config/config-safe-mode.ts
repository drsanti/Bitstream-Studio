import type { ConfigDomain } from "./config-types";

const warnedDomains = new Set<ConfigDomain>();

export function logConfigSafeMode(
  domain: ConfigDomain,
  reason: string,
  detail?: string,
): void {
  if (warnedDomains.has(domain)) {
    return;
  }
  warnedDomains.add(domain);
  const suffix = detail != null ? ` detail=${detail}` : "";
  // eslint-disable-next-line no-console
  console.warn(
    `[ConfigSafeMode] domain=${domain} reason=${reason} fallback=defaults${suffix}`,
  );
}

export function clearSafeModeWarnings(): void {
  warnedDomains.clear();
}
