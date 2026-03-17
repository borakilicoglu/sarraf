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

Trace where a package is used:

```bash
sadrazam . --trace commander
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

## Allowlist Flags

```bash
sadrazam . --ignore-packages react
sadrazam . --allow-unused-dev-dependencies typescript
sadrazam . --allow-missing-packages eslint
```
