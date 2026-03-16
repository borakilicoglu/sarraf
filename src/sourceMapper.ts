import { access, readFile } from "node:fs/promises";
import path from "node:path";

interface SourceMapShape {
  sources?: string[];
  sourceRoot?: string;
}

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"];

export async function mapToSourcePath(rootDir: string, filePath: string): Promise<string> {
  const sourceMapMatch = await mapUsingSourceMap(filePath);

  if (sourceMapMatch) {
    return sourceMapMatch;
  }

  const distHeuristicMatch = await mapDistPathToSource(rootDir, filePath);

  if (distHeuristicMatch) {
    return distHeuristicMatch;
  }

  return filePath;
}

async function mapUsingSourceMap(filePath: string): Promise<string | null> {
  const sourceMapPath = `${filePath}.map`;

  try {
    const sourceMap = JSON.parse(await readFile(sourceMapPath, "utf8")) as SourceMapShape;
    const sourceRoot = sourceMap.sourceRoot ?? "";

    for (const source of sourceMap.sources ?? []) {
      const resolvedSource = path.resolve(path.dirname(sourceMapPath), sourceRoot, source);

      if (await fileExists(resolvedSource)) {
        return resolvedSource;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function mapDistPathToSource(rootDir: string, filePath: string): Promise<string | null> {
  const relativePath = path.relative(rootDir, filePath);
  const normalizedPath = relativePath.split(path.sep).join("/");

  if (!normalizedPath.startsWith("dist/")) {
    return null;
  }

  const withoutDistPrefix = normalizedPath.replace(/^dist\//, "");
  const parsedPath = path.parse(withoutDistPrefix);

  for (const extension of SOURCE_EXTENSIONS) {
    const candidate = path.join(rootDir, "src", parsedPath.dir, `${parsedPath.name}${extension}`);

    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
