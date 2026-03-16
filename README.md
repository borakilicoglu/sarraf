<p align="center">
  <img src="./assets/logo.svg" alt="Sarraf logo" width="200" />
</p>

Sarraf is a dependency analysis CLI for JavaScript and TypeScript projects with optional AI-powered insights.

Sarraf scans your dependencies like a jeweler inspects gold. It finds unused packages, flags dependency hygiene issues, and, when you provide an AI token, can explain findings and suggest cleanup actions directly in the CLI.

Current status:

- unused `dependencies` and `devDependencies`
- script-aware dependency detection
- workspace and monorepo-aware scanning
- text and JSON reporters
- package usage tracing
- source mapping from build output back to source files
- production and strict scan modes
- config file support via `sarraf.json` or `package.json#sarraf`
- ignore and allowlist controls for findings
- AI summaries via `openai`, `anthropic`, or `gemini`

## Why Sarraf?

JavaScript projects accumulate packages over time. Some stop being used. Some belong in `devDependencies` but end up in `dependencies`. Some become outdated, deprecated, or risky.

Sarraf exists to answer a simple question:

Which packages in this project are actually needed, and which ones are adding weight or risk?

Sarraf's direction is:

- cover the core dependency analysis workflow teams expect from a modern dependency scanner
- add an optional AI layer for interpretation, prioritization, and remediation suggestions
- keep the base scanner useful even when no token is provided

## What Sarraf Does

Sarraf analyzes a project by reading its manifest and source files, then comparing declared dependencies with actual usage.

Without AI:

- scans the project
- resolves imported packages
- reports unused or suspicious dependencies

With AI token provided:

- explains why a dependency looks unused or risky
- suggests whether it should be removed, moved, or reviewed
- helps turn raw analysis into actionable cleanup decisions

Current focus:

- read `package.json`
- scan `js`, `ts`, `jsx`, `tsx`, `mjs`, `cjs`, `mts`, `cts` files
- extract package usage from `import`, `export ... from`, `import = require`, `require`, and `require.resolve`
- include package usage referenced from `package.json` scripts
- report unused and suspicious dependency declarations

## MVP Scope

The first version is intentionally narrow.

Included in v1:

- package manifest analysis
- source scan for dependency usage
- unused `dependencies` detection
- unused `devDependencies` detection
- script parser support
- workspace-aware scanning
- trace output for package usage
- source mapping for build output
- reporter support for `text` and `json`
- `production` and `strict` scan modes
- config support
- ignore and allowlist support
- optional AI summaries in the CLI when a valid token is configured

Planned after MVP:

- deeper wrong dependency placement detection
- deprecated package checks
- basic dependency risk score
- CI-friendly output and exit codes
- richer AI remediation suggestions

## Install

Local development:

```bash
npm install
```

When published as an npm package:

```bash
npm install -g sarraf
```

or run it without a global install:

```bash
npx sarraf .
```

## Usage

Scan the current project:

```bash
npx sarraf .
```

Scan a specific directory:

```bash
npx sarraf ./packages/web
```

Scan a single workspace in a monorepo:

```bash
npx sarraf . --workspace packages/web
```

Get JSON output:

```bash
npx sarraf . --reporter json
```

Trace why a package is considered used:

```bash
npx sarraf . --trace typescript
```

Production-only scan:

```bash
npx sarraf . --production
```

Strict mode:

```bash
npx sarraf . --strict
```

Ignore or allow specific findings from the CLI:

```bash
npx sarraf . --ignore-packages react
npx sarraf . --allow-unused-dev-dependencies typescript
```

For local development in this repository:

```bash
npm run dev
npm run build
npm run typecheck
node dist/index.js .
```

Useful local examples:

```bash
node dist/index.js . --debug
node dist/index.js . --exclude unused-devDependencies
node dist/index.js . --reporter json --trace commander
```

## Config

Sarraf can load config from either:

- `sarraf.json`
- `package.json` under the `sarraf` key

Example `sarraf.json`:

```json
{
  "reporter": "json",
  "production": false,
  "strict": false,
  "exclude": ["missing"],
  "ignorePackages": ["react"],
  "allowUnusedDependencies": [],
  "allowUnusedDevDependencies": ["typescript"],
  "allowMissingPackages": [],
  "allowMisplacedDevDependencies": [],
  "workspace": ["packages/web"],
  "ai": {
    "provider": "openai",
    "model": "gpt-4.1"
  }
}
```

CLI flags take precedence over config values.

## Ignore And Allowlist

Use these when a finding is intentionally acceptable:

- `ignorePackages`
- `allowUnusedDependencies`
- `allowUnusedDevDependencies`
- `allowMissingPackages`
- `allowMisplacedDevDependencies`

## AI Mode

Sarraf works in two modes:

- standard analysis mode with no token required
- AI-assisted mode when the user provides an API token

The base CLI remains useful without AI. AI is an upgrade layer, not a requirement.

Environment variables:

```bash
AI_PROVIDER=openai
AI_TOKEN=your_token
AI_MODEL=gpt-4.1
```

Current provider values:

- `openai`
- `anthropic`
- `gemini`

Examples:

```bash
AI_PROVIDER=openai AI_TOKEN=your_token npx sarraf . --ai
AI_PROVIDER=anthropic AI_TOKEN=your_token npx sarraf . --ai
AI_PROVIDER=gemini AI_TOKEN=your_token npx sarraf . --ai
```

CLI overrides:

```bash
npx sarraf . --ai --provider openai --model gpt-4.1
```

What AI currently does:

- summarizes findings
- prioritizes the most important cleanup actions
- turns raw scan output into a short remediation note

What AI does not yet do:

- automatic fixes
- package reputation or security scoring
- multi-step remediation planning

## Testing

Local verification includes fixture-based tests for:

- config loading
- ignore and allowlist behavior
- AI response parsing

Run:

```bash
npm test
```

## Product Vision

Sarraf aims to become a practical dependency audit tool for everyday JavaScript teams.

Not a full software composition analysis platform.
Not a vulnerability database replacement.

The goal is simpler and more useful in daily work:

- show what is unused
- reveal what looks suspicious
- explain findings in plain language when AI is enabled
- make dependency decisions easier during development and in CI

## One-Line Pitch

Sarraf is a CLI that finds unnecessary and risky npm packages, then goes further with optional AI-powered explanations and cleanup guidance.
