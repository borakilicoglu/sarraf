# Real World Validation

## Repositories Checked

- `cli-ts-commander-starter` as a simple TypeScript app
- `pnpm-monorepo-template` as a real pnpm workspace monorepo
- `nodejs/examples` as a CommonJS and nested-package-heavy repository

## Fixes Validated

- Node built-in modules are no longer reported as external packages.
- Known script binaries now map to package names for:
  - `attw` -> `@arethetypeswrong/cli`
  - `biome` -> `@biomejs/biome`
  - `changeset` -> `@changesets/cli`
  - `markdownlint` -> `markdownlint-cli`
  - `tsc` -> `typescript`
- `pnpm-workspace.yaml` is now used for workspace discovery.
- Workspace packages can rely on root-level monorepo tool dependencies without being flagged as missing.
- Nested package directories are excluded from root-level scans in non-workspace repositories.

## Remaining Gaps

- `@types/node` can still appear as an unused `devDependency` in TypeScript repositories that rely on it through config or ambient types rather than direct imports.
- Example-collection repositories that intentionally keep real code only in nested packages may still need explicit workspace or config guidance, because the root package may have very few source files of its own.

## Beta Readiness Impact

This validation round removed the largest blockers from the first real-world repo pass:

- workspace discovery
- local workspace dependency handling
- built-in module filtering
- script binary alias handling

The main follow-up item before beta is type-aware handling for packages like `@types/node`.
