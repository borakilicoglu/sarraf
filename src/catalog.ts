import type { SadrazamConfig } from "./config.js";

export interface ResolvedCatalog {
  packageNames: string[];
  entryFiles: string[];
}

const PACKAGE_REF_PREFIX = "$packages:";
const ENTRY_FILE_REF_PREFIX = "$entryFiles:";

export function resolveCatalogPackageNames(
  values: string[] | undefined,
  config: SadrazamConfig,
): string[] {
  return resolveCatalogValues(values, config.catalog?.packages ?? {}, PACKAGE_REF_PREFIX);
}

export function resolveCatalogEntryFiles(
  values: string[] | undefined,
  config: SadrazamConfig,
): string[] {
  return resolveCatalogValues(values, config.catalog?.entryFiles ?? {}, ENTRY_FILE_REF_PREFIX);
}

export function resolveCatalogInputs(config: SadrazamConfig): ResolvedCatalog {
  return {
    packageNames: resolveCatalogPackageNames(config.inputs?.packageNames, config),
    entryFiles: resolveCatalogEntryFiles(config.inputs?.entryFiles, config),
  };
}

export function getUnusedCatalogHints(config: SadrazamConfig): string[] {
  const usedPackages = collectReferencedKeys(
    [
      config.ignorePackages,
      config.allowUnusedDependencies,
      config.allowUnusedDevDependencies,
      config.allowMissingPackages,
      config.allowMisplacedDevDependencies,
      config.inputs?.packageNames,
    ],
    PACKAGE_REF_PREFIX,
  );
  const usedEntryFiles = collectReferencedKeys([config.inputs?.entryFiles], ENTRY_FILE_REF_PREFIX);

  const hints = [
    ...Object.keys(config.catalog?.packages ?? {})
      .filter((key) => !usedPackages.has(key))
      .map((key) => `catalog.packages.${key} is unused and can be removed.`),
    ...Object.keys(config.catalog?.entryFiles ?? {})
      .filter((key) => !usedEntryFiles.has(key))
      .map((key) => `catalog.entryFiles.${key} is unused and can be removed.`),
  ];

  return hints.sort();
}

function resolveCatalogValues(
  values: string[] | undefined,
  catalog: Record<string, string[]>,
  prefix: string,
): string[] {
  const resolved = new Set<string>();

  for (const value of values ?? []) {
    if (!value.startsWith(prefix)) {
      resolved.add(value);
      continue;
    }

    const key = value.slice(prefix.length);

    for (const entry of catalog[key] ?? []) {
      resolved.add(entry);
    }
  }

  return [...resolved].sort();
}

function collectReferencedKeys(values: Array<string[] | undefined>, prefix: string): Set<string> {
  const keys = new Set<string>();

  for (const list of values) {
    for (const value of list ?? []) {
      if (!value.startsWith(prefix)) {
        continue;
      }

      const key = value.slice(prefix.length).trim();

      if (key) {
        keys.add(key);
      }
    }
  }

  return keys;
}
