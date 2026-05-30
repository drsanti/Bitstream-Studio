import type { ConfigDomain } from "../core/config/config-types";

type MigrationFn = (value: unknown) => unknown;

type DomainMigrationMap = Record<number, MigrationFn>;

const emptyMigrations: DomainMigrationMap = {};

const MIGRATIONS: Record<ConfigDomain, DomainMigrationMap> = {
  theme: emptyMigrations,
  dataTypeColors: emptyMigrations,
  nodeCatalog: emptyMigrations,
  runtimeDefaults: emptyMigrations,
  featureFlags: emptyMigrations,
};

function getConfigVersion(value: unknown): number | null {
  if (
    typeof value === "object" &&
    value != null &&
    "configVersion" in value &&
    typeof (value as { configVersion?: unknown }).configVersion === "number"
  ) {
    return (value as { configVersion: number }).configVersion;
  }
  return null;
}

export function migrateConfigToVersion(
  domain: ConfigDomain,
  value: unknown,
  targetVersion: number,
): unknown {
  let current = value;
  let currentVersion = getConfigVersion(current);
  if (currentVersion == null) {
    return value;
  }
  while (currentVersion < targetVersion) {
    const migrate = MIGRATIONS[domain][currentVersion];
    if (migrate == null) {
      return current;
    }
    current = migrate(current);
    const nextVersion = getConfigVersion(current);
    if (nextVersion == null || nextVersion <= currentVersion) {
      return current;
    }
    currentVersion = nextVersion;
  }
  return current;
}
