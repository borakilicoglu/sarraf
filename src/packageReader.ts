import { readFile } from "node:fs/promises";
import path from "node:path";

export interface PackageMetadata {
  packagePath: string;
  packageDir: string;
  dependencies: Set<string>;
  devDependencies: Set<string>;
  peerDependencies: Set<string>;
  optionalDependencies: Set<string>;
  allDependencies: Set<string>;
  scripts: Record<string, string>;
}

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export async function readPackageMetadata(rootDir: string): Promise<PackageMetadata> {
  const packagePath = await findNearestPackageJson(rootDir);
  const packageJson = (await readPackageJson(packagePath)) as PackageJsonShape;

  const dependencies = new Set<string>(Object.keys(packageJson.dependencies ?? {}));
  const devDependencies = new Set<string>(Object.keys(packageJson.devDependencies ?? {}));
  const peerDependencies = new Set<string>(Object.keys(packageJson.peerDependencies ?? {}));
  const optionalDependencies = new Set<string>(Object.keys(packageJson.optionalDependencies ?? {}));
  const allDependencies = new Set<string>([
    ...dependencies,
    ...devDependencies,
    ...peerDependencies,
    ...optionalDependencies,
  ]);

  return {
    packagePath,
    packageDir: path.dirname(packagePath),
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies,
    allDependencies,
    scripts: packageJson.scripts ?? {},
  };
}

export async function readPackageJson(packagePath: string): Promise<unknown> {
  return JSON.parse(await readFile(packagePath, "utf8"));
}

export async function findNearestPackageJson(startDir: string): Promise<string> {
  let currentDir = path.resolve(startDir);

  while (true) {
    const candidate = path.join(currentDir, "package.json");

    try {
      await readFile(candidate, "utf8");
      return candidate;
    } catch (error) {
      const typedError = error as NodeJS.ErrnoException;

      if (typedError.code !== "ENOENT") {
        throw error;
      }
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      throw new Error(`No package.json found from ${startDir}`);
    }

    currentDir = parentDir;
  }
}
