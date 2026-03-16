#!/usr/bin/env node

import path from "node:path";

import pc from "picocolors";
import { Command } from "commander";

import { resolveAiConfig, SUPPORTED_AI_PROVIDERS } from "./aiConfig.js";
import {
  renderReport,
  SUPPORTED_REPORTERS,
  type ActiveFinding,
  type FindingType,
  type ReporterType,
} from "./reporters.js";
import { scanProject } from "./scan.js";
import { discoverWorkspaces } from "./workspaceFinder.js";

const program = new Command();

const SUPPORTED_FINDING_TYPES: FindingType[] = [
  "missing",
  "unused-dependencies",
  "unused-devDependencies",
  "misplaced-devDependencies",
];

program
  .name("sarraf")
  .description("Scan a project and summarize import usage.")
  .argument("[target]", "directory to scan", ".")
  .option("--ai", "enable AI-assisted analysis")
  .option("--provider <provider>", `AI provider (${SUPPORTED_AI_PROVIDERS.join(", ")})`)
  .option("--model <model>", "AI model name")
  .option("--reporter <type>", `reporter (${SUPPORTED_REPORTERS.join(", ")})`, "text")
  .option("--include <types>", "comma-separated finding types to include")
  .option("--exclude <types>", "comma-separated finding types to exclude")
  .option("--workspace <names>", "comma-separated workspace filters")
  .option("--production", "scan production files only")
  .option("--strict", "flag devDependencies used in production files")
  .option("--debug", "print resolved debug information")
  .option("--trace <package>", "trace where a package is used")
  .action(async (target, options) => {
    try {
      const targetDir = path.resolve(target);
      const aiConfig = resolveAiConfig(options);
      const reporter = parseReporter(options.reporter);
      const include = parseFindingTypes(options.include);
      const exclude = parseFindingTypes(options.exclude);
      const workspaceFilters = parseCsvOption(options.workspace);
      const { rootDir, workspaces } = await discoverWorkspaces(targetDir, workspaceFilters);
      const workspaceReports = await Promise.all(
        workspaces.map(async (workspace) => {
          const result = await scanProject(workspace.dir, {
            production: Boolean(options.production),
            strict: Boolean(options.strict),
          });
          const findings = getActiveFindings(result, include, exclude, Boolean(options.production));

          return {
            workspace,
            result,
            findings,
          };
        }),
      );
      const report = renderReport({
        targetDir: rootDir,
        reporter,
        debug: Boolean(options.debug),
        production: Boolean(options.production),
        strict: Boolean(options.strict),
        include,
        exclude,
        workspaces: workspaceReports,
        ...(options.trace ? { trace: String(options.trace) } : {}),
        ...(aiConfig
          ? {
              ai: {
                provider: aiConfig.provider,
                ...(aiConfig.model ? { model: aiConfig.model } : {}),
              },
            }
          : {}),
      });

      console.log(report);

      if (workspaceReports.some((workspace) => workspace.findings.some((finding) => finding.items.length > 0))) {
        process.exitCode = 2;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(pc.red(`Error: ${message}`));
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);

function getActiveFindings(
  result: Awaited<ReturnType<typeof scanProject>>,
  include: FindingType[],
  exclude: FindingType[],
  production: boolean,
): ActiveFinding[] {
  const candidates: ActiveFinding[] = [
    {
      type: "missing",
      title: "Missing from package.json",
      items: result.missingPackages,
    },
    {
      type: "unused-dependencies",
      title: "Unused dependencies",
      items: result.unusedDependencies,
    },
    {
      type: "unused-devDependencies",
      title: "Unused devDependencies",
      items: production ? [] : result.unusedDevDependencies,
    },
    {
      type: "misplaced-devDependencies",
      title: "Dev dependencies used in production files",
      items: result.misplacedDevDependencies,
    },
  ];

  return candidates.filter((candidate) => {
    if (include.length > 0 && !include.includes(candidate.type)) {
      return false;
    }

    if (exclude.includes(candidate.type)) {
      return false;
    }

    return candidate.items.length > 0;
  });
}

function parseReporter(value: string): ReporterType {
  if (SUPPORTED_REPORTERS.includes(value as ReporterType)) {
    return value as ReporterType;
  }

  throw new Error(
    `Unsupported reporter "${value}". Supported reporters: ${SUPPORTED_REPORTERS.join(", ")}`,
  );
}

function parseFindingTypes(value?: string): FindingType[] {
  const items = parseCsvOption(value);

  for (const item of items) {
    if (!SUPPORTED_FINDING_TYPES.includes(item as FindingType)) {
      throw new Error(
        `Unsupported finding type "${item}". Supported finding types: ${SUPPORTED_FINDING_TYPES.join(", ")}`,
      );
    }
  }

  return items as FindingType[];
}

function parseCsvOption(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
