import { access, readFile } from "node:fs/promises";
import path from "node:path";

import type { FindingType, ReporterType } from "./reporters.js";
import { findNearestPackageJson, readPackageJson } from "./packageReader.js";

export interface SarrafConfig {
  reporter?: ReporterType;
  include?: FindingType[];
  exclude?: FindingType[];
  workspace?: string[];
  production?: boolean;
  strict?: boolean;
  debug?: boolean;
  trace?: string;
  ignorePackages?: string[];
  allowUnusedDependencies?: string[];
  allowUnusedDevDependencies?: string[];
  allowMissingPackages?: string[];
  allowMisplacedDevDependencies?: string[];
  ai?: {
    provider?: string;
    model?: string;
  };
}

export interface LoadedSarrafConfig {
  config: SarrafConfig;
  source: string;
}

interface PackageJsonWithSarraf {
  sarraf?: SarrafConfig;
}

const CONFIG_FILENAMES = ["sarraf.json"];

export async function loadSarrafConfig(startDir: string): Promise<LoadedSarrafConfig> {
  const packagePath = await findNearestPackageJson(startDir);
  const packageDir = path.dirname(packagePath);

  for (const filename of CONFIG_FILENAMES) {
    const configPath = path.join(packageDir, filename);

    if (await fileExists(configPath)) {
      return {
        config: JSON.parse(await readFile(configPath, "utf8")) as SarrafConfig,
        source: configPath,
      };
    }
  }

  const packageJson = (await readPackageJson(packagePath)) as PackageJsonWithSarraf;
  return {
    config: packageJson.sarraf ?? {},
    source: packageJson.sarraf ? `${packagePath}#sarraf` : "defaults",
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
