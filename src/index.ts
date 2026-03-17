#!/usr/bin/env node

import path from "node:path";

import pc from "picocolors";
import { Command } from "commander";

import { generateAiSummary } from "./aiClient.js";
import { resolveAiConfig, SUPPORTED_AI_PROVIDERS } from "./aiConfig.js";
import { loadSarrafConfig, type SarrafConfig } from "./config.js";
import { getActiveFindings, type FindingRules } from "./findings.js";
import {
  renderReport,
  SUPPORTED_REPORTERS,
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
  .description("Analyze dependency usage, detect hygiene issues, and trace why packages are used.")
  .argument("[target]", "directory to scan", ".")
  .option("--ai", "enable AI-assisted analysis")
  .option("--provider <provider>", `AI provider (${SUPPORTED_AI_PROVIDERS.join(", ")})`)
  .option("--model <model>", "AI model name")
  .option("--reporter <type>", `reporter (${SUPPORTED_REPORTERS.join(", ")})`)
  .option("--include <types>", "comma-separated finding types to include")
  .option("--exclude <types>", "comma-separated finding types to exclude")
  .option("--workspace <names>", "comma-separated workspace filters")
  .option("--production", "scan production files only")
  .option("--strict", "flag devDependencies used in production files")
  .option("--debug", "print resolved debug information")
  .option("--trace <package>", "trace where a package is used")
  .option("--ignore-packages <names>", "comma-separated package names to ignore in findings")
  .option("--allow-unused-dependencies <names>", "comma-separated dependency allowlist")
  .option("--allow-unused-dev-dependencies <names>", "comma-separated devDependency allowlist")
  .option("--allow-missing-packages <names>", "comma-separated missing package allowlist")
  .option("--allow-misplaced-dev-dependencies <names>", "comma-separated misplaced devDependency allowlist")
  .addHelpText(
    "after",
    `
Examples:
  sarraf .
  sarraf . --reporter json
  sarraf . --trace typescript
  sarraf . --workspace packages/web
  sarraf . --production --strict
  AI_PROVIDER=openai AI_TOKEN=... sarraf . --ai
`,
  )
  .action(async (target, options) => {
    try {
      const targetDir = path.resolve(target);
      const loadedConfig = await loadSarrafConfig(targetDir);
      const mergedOptions = mergeCliWithConfig(options, loadedConfig.config);
      const aiConfig = resolveAiConfig({
        ai: mergedOptions.ai,
        provider: mergedOptions.provider,
        model: mergedOptions.model,
        configAi: loadedConfig.config.ai,
      });
      const reporter = parseReporter(mergedOptions.reporter);
      const include = parseFindingTypes(mergedOptions.include);
      const exclude = parseFindingTypes(mergedOptions.exclude);
      const workspaceFilters = parseCsvOption(mergedOptions.workspace);
      const rules = buildFindingRules(mergedOptions, include, exclude);
      const { rootDir, workspaces } = await discoverWorkspaces(targetDir, workspaceFilters);
      const workspaceReports = await Promise.all(
        workspaces.map(async (workspace) => {
          const result = await scanProject(workspace.dir, {
            production: Boolean(mergedOptions.production),
            strict: Boolean(mergedOptions.strict),
          });
          const findings = getActiveFindings(result, rules, Boolean(mergedOptions.production));

          return {
            workspace,
            result,
            findings,
          };
        }),
      );
      const warnings: string[] = [];
      let aiSummary: string | undefined;

      if (aiConfig) {
        try {
          aiSummary = await generateAiSummary(aiConfig, workspaceReports);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          warnings.push(`AI summary unavailable: ${message}`);
        }
      }

      const report = renderReport({
        targetDir: rootDir,
        reporter,
        debug: Boolean(mergedOptions.debug),
        production: Boolean(mergedOptions.production),
        strict: Boolean(mergedOptions.strict),
        include,
        exclude,
        workspaces: workspaceReports,
        configSource: loadedConfig.source,
        rulesSummary: {
          ignorePackages: rules.ignorePackages,
          allowUnusedDependencies: rules.allowUnusedDependencies,
          allowUnusedDevDependencies: rules.allowUnusedDevDependencies,
          allowMissingPackages: rules.allowMissingPackages,
          allowMisplacedDevDependencies: rules.allowMisplacedDevDependencies,
        },
        ...(warnings.length > 0 ? { warnings } : {}),
        ...(mergedOptions.trace ? { trace: String(mergedOptions.trace) } : {}),
        ...(aiSummary ? { aiSummary } : {}),
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

function buildFindingRules(
  options: CliOptions,
  include: FindingType[],
  exclude: FindingType[],
): FindingRules {
  return {
    include,
    exclude,
    ignorePackages: parseCsvOption(options.ignorePackages),
    allowUnusedDependencies: parseCsvOption(options.allowUnusedDependencies),
    allowUnusedDevDependencies: parseCsvOption(options.allowUnusedDevDependencies),
    allowMissingPackages: parseCsvOption(options.allowMissingPackages),
    allowMisplacedDevDependencies: parseCsvOption(options.allowMisplacedDevDependencies),
  };
}

interface CliOptions {
  ai: boolean;
  provider: string | undefined;
  model: string | undefined;
  reporter: string;
  include: string | undefined;
  exclude: string | undefined;
  workspace: string | undefined;
  production: boolean;
  strict: boolean;
  debug: boolean;
  trace: string | undefined;
  ignorePackages: string | undefined;
  allowUnusedDependencies: string | undefined;
  allowUnusedDevDependencies: string | undefined;
  allowMissingPackages: string | undefined;
  allowMisplacedDevDependencies: string | undefined;
}

function mergeCliWithConfig(rawOptions: Record<string, unknown>, config: SarrafConfig): CliOptions {
  return {
    ai: Boolean(rawOptions.ai),
    provider: asOptionalString(rawOptions.provider) ?? config.ai?.provider,
    model: asOptionalString(rawOptions.model) ?? config.ai?.model,
    reporter: asOptionalString(rawOptions.reporter) ?? config.reporter ?? "text",
    include: asOptionalString(rawOptions.include) ?? config.include?.join(","),
    exclude: asOptionalString(rawOptions.exclude) ?? config.exclude?.join(","),
    workspace: asOptionalString(rawOptions.workspace) ?? config.workspace?.join(","),
    production: rawOptions.production === true ? true : config.production ?? false,
    strict: rawOptions.strict === true ? true : config.strict ?? false,
    debug: rawOptions.debug === true ? true : config.debug ?? false,
    trace: asOptionalString(rawOptions.trace) ?? config.trace,
    ignorePackages: asOptionalString(rawOptions.ignorePackages) ?? config.ignorePackages?.join(","),
    allowUnusedDependencies:
      asOptionalString(rawOptions.allowUnusedDependencies) ?? config.allowUnusedDependencies?.join(","),
    allowUnusedDevDependencies:
      asOptionalString(rawOptions.allowUnusedDevDependencies) ?? config.allowUnusedDevDependencies?.join(","),
    allowMissingPackages:
      asOptionalString(rawOptions.allowMissingPackages) ?? config.allowMissingPackages?.join(","),
    allowMisplacedDevDependencies:
      asOptionalString(rawOptions.allowMisplacedDevDependencies)
      ?? config.allowMisplacedDevDependencies?.join(","),
  };
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
