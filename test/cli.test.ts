import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();
const cliPath = path.join(rootDir, "dist", "index.js");
const fixtureDir = path.join(rootDir, "test", "fixtures", "config-project");

describe("CLI", () => {
  it("loads sarraf.json config and applies ignore/allowlist rules", () => {
    let stdout = "";

    try {
      stdout = execFileSync("node", [cliPath, fixtureDir], {
        cwd: rootDir,
        encoding: "utf8",
      });
    } catch (error) {
      const typedError = error as { stdout: string };
      stdout = typedError.stdout;
    }

    const report = JSON.parse(stdout);
    const workspace = report.workspaces[0];

    expect(report.workspaces).toHaveLength(1);
    expect(workspace.summary.findings).toBe(0);
    expect(workspace.findings).toEqual([]);
    expect(workspace.summary.scriptCommandPackages).toEqual(["tsx", "typescript"]);
  });
});
