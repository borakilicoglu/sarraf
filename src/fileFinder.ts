import fg from "fast-glob";
import path from "node:path";

const DEFAULT_PATTERNS = ["**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx,svelte,vue,mdx,astro}"];
const DEFAULT_IGNORES = ["**/node_modules/**", "**/dist/**", "**/.git/**"];

export async function findSourceFiles(rootDir: string): Promise<string[]> {
  const cwd = path.resolve(rootDir);
  const nestedPackageIgnores = await findNestedPackageIgnores(cwd);

  return fg(DEFAULT_PATTERNS, {
    cwd,
    absolute: true,
    onlyFiles: true,
    ignore: [...DEFAULT_IGNORES, ...nestedPackageIgnores],
  });
}

async function findNestedPackageIgnores(rootDir: string): Promise<string[]> {
  const packageJsonPaths = await fg("**/package.json", {
    cwd: rootDir,
    onlyFiles: true,
    ignore: DEFAULT_IGNORES,
  });

  return packageJsonPaths
    .map((packageJsonPath) => path.dirname(packageJsonPath).split(path.sep).join("/"))
    .filter((dir) => dir !== ".")
    .map((dir) => `${dir}/**`)
    .sort();
}
