import { access, readFile } from "node:fs/promises";
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
  workspaces?: string[] | { packages?: string[] };
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

  const workspaceRootPath = await findWorkspaceRootPackageJson(path.dirname(packagePath));

  if (workspaceRootPath && workspaceRootPath !== packagePath) {
    const workspaceRootJson = (await readPackageJson(workspaceRootPath)) as PackageJsonShape;

    for (const packageName of [
      ...Object.keys(workspaceRootJson.dependencies ?? {}),
      ...Object.keys(workspaceRootJson.devDependencies ?? {}),
      ...Object.keys(workspaceRootJson.peerDependencies ?? {}),
      ...Object.keys(workspaceRootJson.optionalDependencies ?? {}),
    ]) {
      allDependencies.add(packageName);
    }
  }

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

async function findWorkspaceRootPackageJson(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);

  while (true) {
    const packagePath = path.join(currentDir, "package.json");

    try {
      const packageJson = (await readPackageJson(packagePath)) as PackageJsonShape;

      if (hasWorkspaceConfig(packageJson) || await hasPnpmWorkspaceFile(currentDir)) {
        return packagePath;
      }
    } catch (error) {
      const typedError = error as NodeJS.ErrnoException;

      if (typedError.code !== "ENOENT") {
        throw error;
      }
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function hasWorkspaceConfig(packageJson: PackageJsonShape): boolean {
  return Array.isArray(packageJson.workspaces) || Array.isArray(packageJson.workspaces?.packages);
}

async function hasPnpmWorkspaceFile(dir: string): Promise<boolean> {
  try {
    await access(path.join(dir, "pnpm-workspace.yaml"));
    return true;
  } catch {
    return false;
  }
}
