import { readFile } from "node:fs/promises";
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
  const workspacePatterns = await normalizeWorkspacePatterns(rootDir, rootPackage.workspaces);

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

async function normalizeWorkspacePatterns(
  rootDir: string,
  workspaces: RootPackageJsonShape["workspaces"],
): Promise<string[]> {
  const packageJsonPatterns = Array.isArray(workspaces)
    ? workspaces
    : workspaces?.packages ?? [];
  const pnpmPatterns = await readPnpmWorkspacePatterns(rootDir);

  return [...new Set([...packageJsonPatterns, ...pnpmPatterns])];
}

async function readPnpmWorkspacePatterns(rootDir: string): Promise<string[]> {
  const workspacePath = path.join(rootDir, "pnpm-workspace.yaml");

  try {
    const source = await readFile(workspacePath, "utf8");
    const lines = source.split(/\r?\n/);
    const patterns: string[] = [];
    let inPackagesSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      if (!inPackagesSection) {
        if (trimmed === "packages:") {
          inPackagesSection = true;
        }
        continue;
      }

      if (/^[A-Za-z0-9_-]+:\s*$/.test(trimmed) && !trimmed.startsWith("-")) {
        break;
      }

      const match = trimmed.match(/^\-\s*(.+)$/);
      const workspacePattern = match?.[1];

      if (!workspacePattern) {
        continue;
      }

      patterns.push(workspacePattern.trim().replace(/^['"]|['"]$/g, ""));
    }

    return patterns;
  } catch (error) {
    const typedError = error as NodeJS.ErrnoException;

    if (typedError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
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
