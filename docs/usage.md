# CLI Usage

## Common Commands

Scan the current directory:

```bash
sadrazam .
```

Scan a specific package or app:

```bash
sadrazam ./packages/web
```

Limit the scan to one workspace:

```bash
sadrazam . --workspace packages/web
```

Emit JSON:

```bash
sadrazam . --reporter json
```

Emit TOON:

```bash
sadrazam . --reporter toon
```

Focus on file and export hygiene:

```bash
sadrazam . --include unused-files,unused-exports
```

Measure scan performance with cache enabled:

```bash
sadrazam . --cache --performance
```

Trace where a package is used:

```bash
sadrazam . --trace commander
```

Trace where an export is used:

```bash
sadrazam . --trace-export src/lib.ts:usedHelper
```

Apply safe `package.json` cleanup and formatting:

```bash
sadrazam . --fix --format
```

## Scan Modes

Production-only scan:

```bash
sadrazam . --production
```

Strict mode flags `devDependencies` used by production files:

```bash
sadrazam . --strict
```

## Finding Filters

Include only selected finding types:

```bash
sadrazam . --include missing,unused-dependencies
```

Exclude noisy finding types:

```bash
sadrazam . --exclude unused-devDependencies
```

## Auto-fix And Format

Use `--fix` to remove deterministic unused package declarations from `package.json`:

```bash
sadrazam . --fix
```

Use `--fix --format` to also normalize the modified `package.json` file:

```bash
sadrazam . --fix --format
```

## Allowlist Flags

```bash
sadrazam . --ignore-packages react
sadrazam . --allow-unused-dev-dependencies typescript
sadrazam . --allow-missing-packages eslint
```

## Findings

Sadrazam currently reports these main finding groups:

- `missing`
- `unused-dependencies`
- `unused-devDependencies`
- `misplaced-devDependencies`
- `unused-files`
- `unused-exports`

Use `--include` and `--exclude` to focus the output on the findings you care about.
