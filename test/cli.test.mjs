import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const cliPath = path.join(rootDir, "dist", "index.js");
const fixtureDir = path.join(rootDir, "test", "fixtures", "config-project");

test("loads sarraf.json config and applies ignore/allowlist rules", () => {
  let stdout = "";

  try {
    stdout = execFileSync("node", [cliPath, fixtureDir], {
      cwd: rootDir,
      encoding: "utf8",
    });
  } catch (error) {
    const typedError = error;
    stdout = typedError.stdout;
  }

  const report = JSON.parse(stdout);
  const workspace = report.workspaces[0];

  assert.equal(report.workspaces.length, 1);
  assert.equal(workspace.summary.findings, 0);
  assert.deepEqual(workspace.findings, []);
  assert.deepEqual(workspace.summary.scriptCommandPackages, ["tsx", "typescript"]);
});
