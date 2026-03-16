import fg from "fast-glob";
import path from "node:path";

import { findNearestPackageJson, readPackageJson } from "./packageReader.js";

export interface WorkspaceTarget {
  name: string;
  dir: string;
  packagePath: string;
  relativeDir: string;
}

interface RootPackageJsonShape {
  name?: string;
  workspaces?: string[] | { packages?: string[] };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export async function discoverWorkspaces(
  startDir: string,
  filters: string[],
): Promise<{ rootDir: string; workspaces: WorkspaceTarget[] }> {
  const rootPackagePath = await findNearestPackageJson(startDir);
  const rootDir = path.dirname(rootPackagePath);
  const rootPackage = (await readPackageJson(rootPackagePath)) as RootPackageJsonShape;
  const workspacePatterns = normalizeWorkspacePatterns(rootPackage.workspaces);

  const workspaces = workspacePatterns.length > 0
    ? await findDeclaredWorkspaces(rootDir, workspacePatterns)
    : [createWorkspaceTarget(rootDir, rootPackagePath, rootPackage.name)];

  const filteredWorkspaces = filters.length > 0
    ? workspaces.filter((workspace) => matchesWorkspaceFilter(workspace, filters))
    : workspaces;

  if (filteredWorkspaces.length === 0) {
    throw new Error(`No workspaces matched: ${filters.join(", ")}`);
  }

  return {
    rootDir,
    workspaces: filteredWorkspaces,
  };
}

async function findDeclaredWorkspaces(
  rootDir: string,
  patterns: string[],
): Promise<WorkspaceTarget[]> {
  const packageFiles = await fg(
    patterns.map((pattern) => normalizeWorkspacePattern(pattern)),
    {
      cwd: rootDir,
      absolute: true,
      onlyFiles: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    },
  );

  const workspaceTargets = await Promise.all(
    packageFiles.map(async (packagePath) => {
      const packageJson = (await readPackageJson(packagePath)) as RootPackageJsonShape;

      return createWorkspaceTarget(
        path.dirname(packagePath),
        packagePath,
        packageJson.name,
        rootDir,
      );
    }),
  );

  return workspaceTargets.sort((left, right) => left.relativeDir.localeCompare(right.relativeDir));
}

function normalizeWorkspacePatterns(
  workspaces: RootPackageJsonShape["workspaces"],
): string[] {
  if (Array.isArray(workspaces)) {
    return workspaces;
  }

  if (workspaces?.packages) {
    return workspaces.packages;
  }

  return [];
}

function normalizeWorkspacePattern(pattern: string): string {
  return pattern.endsWith("/package.json") ? pattern : `${pattern.replace(/\/$/, "")}/package.json`;
}

function createWorkspaceTarget(
  dir: string,
  packagePath: string,
  packageName?: string,
  rootDir: string = dir,
): WorkspaceTarget {
  const relativeDir = path.relative(rootDir, dir) || ".";

  return {
    name: packageName ?? path.basename(dir),
    dir,
    packagePath,
    relativeDir,
  };
}

function matchesWorkspaceFilter(workspace: WorkspaceTarget, filters: string[]): boolean {
  return filters.some((filter) =>
    workspace.name === filter ||
    workspace.relativeDir === filter ||
    workspace.relativeDir.startsWith(filter)
  );
}
