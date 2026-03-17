# Sadrazam

Sadrazam is a dependency analysis CLI for JavaScript and TypeScript projects with optional AI-powered insights.

It scans source files, package manifests, and scripts to find unused packages, suspicious declarations, and dependency hygiene issues before they turn into project debt.

## What It Covers

- unused `dependencies` and `devDependencies`
- missing package declarations
- production and strict scan modes
- workspace and monorepo-aware scanning
- package trace output
- config-based allowlists and ignore rules
- optional AI summaries through `openai`, `anthropic`, and `gemini`

## Quick Example

```bash
npx sadrazam .
npx sadrazam . --reporter json
AI_PROVIDER=openai AI_TOKEN=your_token npx sadrazam . --ai
```

## Next Steps

- [Getting Started](/getting-started)
- [CLI Usage](/usage)
- [Config](/config)
- [AI Mode](/ai-mode)
